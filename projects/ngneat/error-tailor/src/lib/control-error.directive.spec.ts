import { Component, Type } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule, FormControl, FormArray } from '@angular/forms';
import { Spectator, createComponentFactory, byPlaceholder, byText } from '@ngneat/spectator';

import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { ControlErrorsDirective } from './control-error.directive';
import { FORM_ERRORS } from './providers';
import { ControlErrorComponent } from './control-error.component';
import { FormSubmitDirective } from './form-submit.directive';

function getComponentFactory<C>(component: Type<C>) {
  return createComponentFactory({
    component,
    imports: [FormsModule, ReactiveFormsModule],
    declarations: [ControlErrorsDirective, FormSubmitDirective, ControlErrorComponent, ControlErrorAnchorDirective],
    providers: [
      {
        provide: FORM_ERRORS,
        useValue: {
          required: () => 'required error',
          minlength: () => 'min error',
          requiredone: () => 'required one error'
        }
      }
    ]
  });
}

function typeInElementAndFocusOut(spectator: Spectator<any>, text: string, input: Element) {
  spectator.typeInElement(text, input);
  spectator.dispatchFakeEvent(input, 'focusout');
}

describe('ControlErrorDirective', () => {
  describe('FormGroup', () => {
    @Component({
      template: `
        <form [formGroup]="form" errorTailor>
          <input formControlName="name" placeholder="Name" />

          <input type="checkbox" formControlName="terms" id="check" [controlErrorAnchor]="anchor" />
          <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>

          <div formArrayName="names">
            <div *ngFor="let name of form.controls.names.controls; index as i">
              <input [formControl]="name" placeholder="Name {{ i }}" />
            </div>
          </div>
        </form>
      `
    })
    class FormGroupComponent {
      form = this.builder.group({
        name: this.createName(),
        terms: [false, Validators.requiredTrue],
        names: this.builder.array([this.createName(), this.createName()], this.validator)
      });

      constructor(private builder: FormBuilder) {}

      createName() {
        return new FormControl('', [Validators.required, Validators.minLength(3)]);
      }

      validator({ controls }: FormArray) {
        return controls.some(control => control.valid) ? null : { requiredone: true };
      }
    }

    let spectator: Spectator<FormGroupComponent>;

    const createComponent = getComponentFactory(FormGroupComponent);

    beforeEach(() => (spectator = createComponent()));

    it('should create', () => {
      expect(spectator.component).toBeTruthy();
    });

    it('should show errors on interactions', () => {
      const nameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

      typeInElementAndFocusOut(spectator, 't', nameInput);

      expect(spectator.query(byText('min error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, '', nameInput);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'test', nameInput);

      const oneNameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name 0'));

      typeInElementAndFocusOut(spectator, '', oneNameInput);

      expect(spectator.query(byText('required one error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'no error', oneNameInput);

      expect(spectator.query(byText(/error/))).toBeNull();
    });
  });

  describe('FormControl', () => {
    @Component({
      template: `
        <input [formControl]="name" placeholder="Name" />
      `
    })
    class FormControlComponent {
      name = new FormControl('', [Validators.required, Validators.minLength(3)]);
    }

    let spectator: Spectator<FormControlComponent>;

    const createComponent = getComponentFactory(FormControlComponent);

    beforeEach(() => (spectator = createComponent()));

    it('should create', () => {
      expect(spectator.component).toBeTruthy();
    });

    it('should show errors on interactions', () => {
      const nameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

      typeInElementAndFocusOut(spectator, 't', nameInput);

      expect(spectator.query(byText('min error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, '', nameInput);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'test', nameInput);

      expect(spectator.query(byText(/error/))).toBeNull();
    });
  });

  describe('NgModel', () => {
    @Component({
      template: `
        <input [(ngModel)]="name" placeholder="Name" required minlength="3" />
      `
    })
    class NgModelComponent {
      name = '';
    }

    let spectator: Spectator<NgModelComponent>;

    const createComponent = getComponentFactory(NgModelComponent);

    beforeEach(() => (spectator = createComponent()));

    it('should create', () => {
      expect(spectator.component).toBeTruthy();
    });

    it('should show errors on interactions', () => {
      const nameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

      typeInElementAndFocusOut(spectator, 't', nameInput);

      expect(spectator.query(byText('min error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, '', nameInput);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'test', nameInput);

      expect(spectator.query(byText(/error/))).toBeNull();
    });
  });

  // TODO: control-error.directive isn't working with ngModelGroup
  xdescribe('NgModelGroup', () => {
    @Component({
      template: `
        <form>
          <div ngModelGroup="name">
            <input [(ngModel)]="name.firstname" placeholder="first name" required minlength="3" />
            <input [(ngModel)]="name.surname" placeholder="surn name" required minlength="3" />
          </div>
        </form>
      `
    })
    class NgModelGroupComponent {
      name = { firstname: '', surname: '' };
    }
    let spectator: Spectator<NgModelGroupComponent>;

    const createComponent = getComponentFactory(NgModelGroupComponent);

    beforeEach(() => (spectator = createComponent()));

    it('should create', () => {
      expect(spectator.component).toBeTruthy();
    });
  });

  describe('common', () => {
    @Component({
      template: `
        <form [formGroup]="form" errorTailor>
          <input formControlName="customErrors" placeholder="Custom errors" [controlErrors]="customErrors" />

          <ng-template #customTpl let-errors let-text="text">
            custom template {{ errors | json }} {{ text }}
          </ng-template>
          <input formControlName="customTemplate" placeholder="Custom template" [controlErrorsTpl]="customTpl" />

          <input formControlName="customClass" placeholder="Custom class" controlErrorsClass="customClass" />

          <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>
          <input formControlName="withAnchor" placeholder="With anchor" [controlErrorAnchor]="anchor" />

          <div controlErrorAnchor>
            <input formControlName="withParentAnchor" placeholder="With parent anchor" />
          </div>

          <input formControlName="onEveryChange" placeholder="On every change" [controlErrorsOnBlur]="false" />
        </form>
      `
    })
    class CommonFormGroupComponent {
      form = this.builder.group({
        customErrors: new FormControl('', [Validators.required, Validators.minLength(3)]),
        customTemplate: ['', Validators.required],
        customClass: ['', Validators.required],
        withAnchor: ['', Validators.required],
        withParentAnchor: ['', Validators.required],
        onEveryChange: ['', [Validators.required, Validators.minLength(3)]]
      });

      customErrors = {
        required: 'custom required error'
      };

      constructor(private builder: FormBuilder) {}
    }

    let spectator: Spectator<CommonFormGroupComponent>;

    const createComponent = getComponentFactory(CommonFormGroupComponent);

    beforeEach(() => (spectator = createComponent()));

    it('should show customError when there is', () => {
      const input = spectator.query<HTMLInputElement>(byPlaceholder('Custom errors'));

      typeInElementAndFocusOut(spectator, '', input);

      expect(spectator.query(byText('custom required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 't', input);

      expect(spectator.query(byText('min error'))).toBeTruthy();
    });

    it('should create template when template is provided', () => {
      const input = spectator.query<HTMLInputElement>(byPlaceholder('Custom template'));

      typeInElementAndFocusOut(spectator, '', input);

      expect(spectator.query(byText('custom template { "required": true } required error'))).toBeTruthy();
    });

    it('should set custom class when it is provided', () => {
      const input = spectator.query<HTMLInputElement>(byPlaceholder('Custom class'));

      typeInElementAndFocusOut(spectator, '', input);

      expect(spectator.query('.customClass')).toBeTruthy();
    });

    describe('when anchor is provided', () => {
      it('should create show error message on anchor', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('With anchor'));

        typeInElementAndFocusOut(spectator, '', input);

        const error = spectator.query(byText('required error'));

        expect(error).toBeTruthy();
        expect(error.parentElement.nextElementSibling).toBe(input);
      });

      it('should create show error message on parent anchor', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('With parent anchor'));

        typeInElementAndFocusOut(spectator, '', input);

        const error = spectator.query(byText('required error'));

        expect(error).toBeTruthy();

        const divContainer = error.parentElement.previousElementSibling;

        expect(divContainer.firstElementChild).toBe(input);
      });
    });

    it('should show error on change', () => {
      const input = spectator.query<HTMLInputElement>(byPlaceholder('On every change'));

      spectator.typeInElement('', input);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      spectator.typeInElement('t', input);

      expect(spectator.query(byText('min error'))).toBeTruthy();
    });
  });
});
