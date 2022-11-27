import { Component, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';

import { ControlErrorsDirective } from '@ngneat/error-tailor';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  form: UntypedFormGroup;
  model = 'Hey';

  options = Array.from(Array(5), (_, i) => ({
    label: `Animal ${i + 1}`,
    id: i + 1
  }));

  extraErrors = {
    minlength: ({ requiredLength }) => `Use country abbreviation! (min ${requiredLength} chars)`,
    maxlength: 'Use country abbreviation! (max 3 chars)'
  };

  @ViewChild('gdprErrorTailor', { static: true }) gdprErrorTailor: ControlErrorsDirective;

  formGroup = this.builder.group({
    name: [null, Validators.required],
    emailAddresses: this.builder.array([this.initEmailAddressFields()])
  });

  get emailAddresses() {
    return this.formGroup.get('emailAddresses') as UntypedFormArray;
  }

  initEmailAddressFields(): UntypedFormGroup {
    return this.builder.group({
      label: [null, Validators.required],
      emailAddress: [null, [Validators.required, Validators.email]]
    });
  }

  addNewInputField(): void {
    const control = this.formGroup.controls.emailAddresses as UntypedFormArray;
    const group = this.initEmailAddressFields();
    control.push(group);
  }

  removeInputField(i: number): void {
    const control = this.formGroup.controls.emailAddresses as UntypedFormArray;
    control.removeAt(i);
  }

  constructor(private builder: UntypedFormBuilder) {}

  ngOnInit() {
    this.form = this.builder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      terms: [false, Validators.requiredTrue],
      languages: ['', Validators.required],
      animal: [null, Validators.required],
      address: this.builder.group(
        {
          city: ['', Validators.required],
          country: ['', [Validators.minLength(2), Validators.maxLength(3)]]
        },
        { validator: addressValidator }
      ),
      gdpr: [false, Validators.requiredTrue]
    });
    /**
     * It's not necessary to set errors directly. It's done via the validator itself.
     * If it would be necessary to use, then: this.form.get('gdpr').setErrors({ required: true });
     * The already existed validation error on controls is the basic condition
     * for sensible use of methods showError/hideError.
     */
  }

  showError(): void {
    this.gdprErrorTailor.showError();
  }

  hideError(): void {
    this.gdprErrorTailor.hideError();
  }

  submit() {}
}

function addressValidator(addr: UntypedFormGroup) {
  return addr.value && addr.value.country && addr.value.city ? null : { invalidAddress: true };
}
