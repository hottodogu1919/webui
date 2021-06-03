import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { helptext_system_bootenv } from 'app/helptext/system/bootenv';
import { BootEnvService, WebSocketService } from '../../../../services';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { regexValidator } from '../../../common/entity/entity-form/validators/regex-validation';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-bootenv-add',
  template: '<entity-form [conf]="this"></entity-form>',
  providers: [BootEnvService],
})
export class BootEnvironmentCloneComponent implements FormConfiguration {
  route_success: string[] = ['system', 'boot'];
  addCall: 'bootenv.create' = 'bootenv.create';
  pk: any;
  isNew = true;
  isEntity = true;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected bootEnvService: BootEnvService,
  ) {}

  preInit(): void {
    this.route.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = params['pk'];
      this.fieldSets = [
        {
          name: helptext_system_bootenv.clone_fieldset,
          class: 'clone',
          label: true,
          config: [
            {
              type: 'input',
              name: 'name',
              placeholder: helptext_system_bootenv.clone_name_placeholder,
              tooltip: helptext_system_bootenv.clone_name_tooltip,
              validation: [regexValidator(this.bootEnvService.bootenv_name_regex)],
              required: true,
            },
            {
              type: 'input',
              name: 'source',
              placeholder: helptext_system_bootenv.clone_source_placeholder,
              tooltip: helptext_system_bootenv.clone_source_tooltip,
              value: this.pk,
              readonly: true,
            },
          ],
        }];
    });
  }
}
