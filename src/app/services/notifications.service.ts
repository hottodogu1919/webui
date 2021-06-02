import { Injectable } from '@angular/core';
import { Alert } from 'app/interfaces/alert.interface';

import { Observable, Subject, Subscription } from 'rxjs';
import * as _ from 'lodash';

import { AlertLevel } from 'app/enums/alert-level.enum';
import { WebSocketService, SystemGeneralService } from 'app/services';

export interface NotificationAlert {
  id: string;
  message: string;
  icon: string;
  icon_tooltip: string;
  time: string;
  time_locale: string;
  timezone: string;
  route: string;
  color: string;
  level: AlertLevel;
  dismissed: boolean;
}

@Injectable()
export class NotificationsService {
  private subject = new Subject<any>();
  private notifications: NotificationAlert[] = [];
  private locale = 'en-US';
  private timeZone = 'UTC';
  private getGenConfig: Subscription;

  constructor(
    private ws: WebSocketService,
    private sysGeneralService: SystemGeneralService,
  ) {
    this.initMe();
  }

  initMe(): void {
    this.getGenConfig = this.sysGeneralService.getGeneralConfig.subscribe((res) => {
      if (res.timezone !== 'WET' && res.timezone !== 'posixrules') {
        this.timeZone = res.timezone;
      }

      this.ws.call('alert.list').subscribe((alerts) => {
        this.notifications = this.alertsArrivedHandler(alerts);
        this.subject.next(this.notifications);
      });

      this.ws.sub<Alert>('alert.list').subscribe((alert) => {
        // check for updates to alerts
        const notification = this.alertsArrivedHandler([alert])[0];
        if (!_.find(this.notifications, { id: notification.id })) {
          this.notifications.push(notification);
        }
        this.subject.next(this.notifications);
      });

      this.ws.subscribe('alert.list').subscribe((res) => {
        // check for changed alerts
        if (res && res.msg === 'changed' && res.cleared) {
          const index = _.findIndex(this.notifications, { id: res.id });
          if (index !== -1) {
            this.notifications.splice(index, 1);
          }
          this.subject.next(this.notifications);
        }
      });
    });
  }

  getNotifications(): Observable<any> {
    return this.subject.asObservable();
  }

  getNotificationList(): NotificationAlert[] {
    return this.notifications;
  }

  dismissNotifications(notifications: NotificationAlert[]): void {
    const notificationMap = new Map<string, NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.dismiss', [notification.id]).subscribe(() => {});
    });

    this.notifications.forEach((notification) => {
      if (notificationMap.has(notification.id) === true) {
        notification.dismissed = true;
      }
    });

    this.subject.next(this.notifications);
  }

  restoreNotifications(notifications: NotificationAlert[]): void {
    const notificationMap = new Map<string, NotificationAlert>();

    notifications.forEach((notification) => {
      notificationMap.set(notification.id, notification);
      this.ws.call('alert.restore', [notification.id]).subscribe(() => {});
    });

    this.notifications.forEach((notification) => {
      if (notificationMap.has(notification.id) === true) {
        notification.dismissed = false;
      }
    });

    this.subject.next(this.notifications);
  }

  private alertsArrivedHandler(alerts: Alert[]): NotificationAlert[] {
    if (!alerts) {
      return [];
    }

    return alerts.map((alert) => this.addNotification(alert));
  }

  private addNotification(alert: Alert): NotificationAlert {
    const id: string = alert.id;
    const dismissed: boolean = alert.dismissed;
    const message: string = <string>alert.formatted;
    const level: AlertLevel = alert.level;
    const date: Date = new Date(alert.datetime.$date);
    const dateStr = date.toUTCString();
    const dateStrLocale = date.toLocaleString(this.locale, { timeZone: this.timeZone });
    const one_shot: boolean = alert.one_shot;
    let icon_tooltip: string = <string>alert.level;
    const routeName = '/dashboard';
    let icon = 'info';
    let color = 'primary';

    if (level === AlertLevel.Warning) {
      icon = 'warning';
      color = 'accent';
    } else if (level === AlertLevel.Error) {
      icon = 'error';
      color = 'warn';
    } else if (level === AlertLevel.Critical) {
      icon = 'error';
      color = 'warn';
    }

    if (one_shot) {
      icon = 'notifications_active';
      icon_tooltip = 'This is a ONE-SHOT ' + level + " alert, it won't be dismissed automatically";
    }

    const newNotification: NotificationAlert = {
      id,
      message,
      icon,
      icon_tooltip,
      time: dateStr,
      time_locale: dateStrLocale,
      timezone: this.timeZone,
      route: routeName,
      color,
      level,
      dismissed,
    };

    return newNotification;
  }

  ngOnDestroy(): void {
    this.getGenConfig.unsubscribe();
  }
}
