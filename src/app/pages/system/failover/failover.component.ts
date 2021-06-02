import { Component, OnDestroy } from '@angular/core';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { Subscription } from 'rxjs';
import { AppLoaderService } from '../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../services/dialog.service';
import { MatDialog } from '@angular/material/dialog';
import { EntityUtils } from '../../common/entity/utils';
import { WebSocketService } from '../../../services';
import { T } from '../../../translate-marker';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { helptext_system_failover } from 'app/helptext/system/failover';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-system-failover',
  template: '<entity-form [conf]="this"></entity-form>',
  styleUrls: [],
  providers: [],
})

export class FailoverComponent implements FormConfiguration, OnDestroy {
  queryCall: 'failover.config' = 'failover.config';
  updateCall = 'failover.update';
  entityForm: any;
  protected failoverDisableSubscription: any;
  alreadyDisabled = false;
  confirmSubmit = false;
  saveSubmitText = helptext_system_failover.save_button_text;
  confirmSubmitDialog = {
    title: T('Disable Failover'),
    message: T(''),
    hideCheckbox: false,
  };
  masterSubscription: any;
  master_fg: any;
  warned = false;

  custActions: any[] = [
    {
      id: 'sync_to_peer',
      name: T('Sync to Peer'),
      function: () => {
        const params = [{ reboot: false }];
        const ds = this.dialog.confirm(
          helptext_system_failover.dialog_sync_to_peer_title,
          helptext_system_failover.dialog_sync_to_peer_message,
          false, helptext_system_failover.dialog_button_ok,
          true,
          helptext_system_failover.dialog_sync_to_peer_checkbox,
          'failover.sync_to_peer',
          params,
        );
        ds.afterClosed().subscribe((status: any) => {
          if (status) {
            this.load.open();
            this.ws.call(
              ds.componentInstance.method, ds.componentInstance.data,
            ).subscribe(() => {
              this.load.close();
              this.dialog.Info(helptext_system_failover.confirm_dialogs.sync_title,
                helptext_system_failover.confirm_dialogs.sync_to_message, '', 'info', true);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWSError(this.entityForm, err);
            });
          }
        });
      },
    },
    {
      id: 'sync_from_peer',
      name: T('Sync from Peer'),
      function: () => {
        this.dialog.confirm(helptext_system_failover.dialog_sync_from_peer_title,
          helptext_system_failover.dialog_sync_from_peer_message, false,
          helptext_system_failover.dialog_button_ok).subscribe((confirm: boolean) => {
          if (confirm) {
            this.load.open();
            this.ws.call('failover.sync_from_peer').subscribe(() => {
              this.load.close();
              this.dialog.Info(helptext_system_failover.confirm_dialogs.sync_title,
                helptext_system_failover.confirm_dialogs.sync_from_message, '', 'info', true);
            }, (err) => {
              this.load.close();
              new EntityUtils().handleWSError(this.entityForm, err);
            });
          }
        });
      },
    },
  ];

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext_system_failover.fieldset_title,
      width: '100%',
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'disabled',
          placeholder: helptext_system_failover.disabled_placeholder,
          tooltip: helptext_system_failover.disabled_tooltip,
        }, {
          type: 'checkbox',
          name: 'master',
          placeholder: helptext_system_failover.master_placeholder,
          tooltip: helptext_system_failover.master_tooltip,
          value: true,
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'disabled',
                value: false,
              }],
            },
          ],
        }, {
          type: 'input',
          name: 'timeout',
          placeholder: helptext_system_failover.timeout_placeholder,
          tooltip: helptext_system_failover.timeout_tooltip,
        },
      ],
    }];

  constructor(
    private load: AppLoaderService,
    private dialog: DialogService,
    private ws: WebSocketService,
    protected matDialog: MatDialog,
  ) {}

  afterInit(entityEdit: any): void {
    this.entityForm = entityEdit;
    this.failoverDisableSubscription = this.entityForm.formGroup.controls['disabled'].valueChanges.subscribe((res: boolean) => {
      if (!this.alreadyDisabled) {
        this.confirmSubmit = res;
      }
    });
    this.master_fg = this.entityForm.formGroup.controls['master'];
    this.masterSubscription = this.master_fg.valueChanges.subscribe((res: any) => {
      if (!res && !this.warned) {
        this.dialog.confirm({
          title: helptext_system_failover.master_dialog_title,
          message: helptext_system_failover.master_dialog_warning,
          buttonMsg: T('Continue'),
          cancelMsg: T('Cancel'),
          disableClose: true,
        }).subscribe((confirm) => {
          if (!confirm) {
            this.master_fg.setValue(true);
          } else {
            this.warned = true;
          }
        });
      }
      if (res) {
        this.entityForm.saveSubmitText = helptext_system_failover.save_button_text;
      } else {
        this.entityForm.saveSubmitText = helptext_system_failover.failover_button_text;
      }
    });
  }

  customSubmit(body: any): Subscription {
    this.load.open();
    return this.ws.call('failover.update', [body]).subscribe(() => {
      this.alreadyDisabled = body['disabled'];
      this.load.close();
      this.dialog.Info(T('Settings saved.'), '', '300px', 'info', true).subscribe(() => {
        if (body.disabled && !body.master) {
          this.ws.logout();
        }
      });
    }, (res) => {
      this.load.close();
      new EntityUtils().handleWSError(this.entityForm, res);
    });
  }

  resourceTransformIncomingRestData(value: any): any {
    this.alreadyDisabled = value['disabled'];
    value['master'] = true;
    return value;
  }

  ngOnDestroy(): void {
    this.failoverDisableSubscription.unsubscribe();
  }
}
