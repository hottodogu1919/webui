import {
  Component, EventEmitter, forwardRef, Input, Output,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'ix-input',
  styleUrls: ['./ix-input.component.scss'],
  templateUrl: './ix-input.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IxInput),
      multi: true,
    },
  ],
})
export class IxInput implements ControlValueAccessor {
  @Input() label: string;
  @Input() placeholder: string;
  @Input() prefixText: string;
  @Input() suffixIcon: string;
  @Output() suffixIconClick: EventEmitter<MouseEvent> = new EventEmitter();
  @Input() hint: string;
  @Input() tooltip: string;
  @Input() required: boolean;

  val: string | number = '';

  onChange: any = (): void => {};
  onTouch: any = (): void => {};

  set value(val: string | number) {
    this.val = val;
    this.onChange(val);
    this.onTouch(val);
  }

  suffixIconClicked(evt: MouseEvent): void {
    this.suffixIconClick.emit(evt);
  }

  writeValue(val: string | number): void {
    this.val = val;
  }

  registerOnChange(onChange: any): void {
    this.onChange = onChange;
  }

  registerOnTouched(onTouched: any): void {
    this.onTouch = onTouched;
  }
}
