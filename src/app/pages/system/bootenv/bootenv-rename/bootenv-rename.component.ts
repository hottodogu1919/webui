import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { Observable } from 'rxjs';
import { BootEnvService, WebSocketService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-rename',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [BootEnvService],
})
export class BootEnvironmentRenameComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot'];
  editCall: 'bootenv.update' = 'bootenv.update';
  pk: any;
  isNew = false;
  isEntity = true;
  protected entityForm: EntityFormComponent;

  fieldConfig: FieldConfig[];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected bootEnvService: BootEnvService,
  ) {}

  preInit(entityForm: EntityFormComponent): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
      this.fieldConfig = [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext_system_bootenv.rename_name_placeholder,
          tooltip: helptext_system_bootenv.create_name_tooltip,
          validation: [regexValidator(this.bootEnvService.bootenv_name_regex)],
          required: true,
        },
      ];
    });
    this.entityForm = entityForm;
  }

  afterInit(entityForm: EntityFormComponent): void {
    entityForm.submitFunction = this.submitFunction;
  }

  submitFunction(entityForm: any): Observable<any> {
    const payload: any = {};
    payload['name'] = entityForm.name;
    return this.ws.call('bootenv.update', [this.pk, payload]);
  }
}
