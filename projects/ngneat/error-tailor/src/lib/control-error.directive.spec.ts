import { Component, inject, Type, ViewChild } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
import {
  AbstractControl,
  FormsModule,
  NgControl,
  ReactiveFormsModule,
  UntypedFormArray,
  UntypedFormBuilder,
  UntypedFormControl,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ControlErrorsDirective, errorTailorImports, provideErrorTailorConfig } from '@ngneat/error-tailor';
import { byPlaceholder, byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { map, asyncScheduler, Observable, scheduled } from 'rxjs';
import { DefaultControlErrorComponent } from './control-error.component';
import { CommonModule } from '@angular/common';

function getComponentFactory<C>(component: Type<C>) {
  return createComponentFactory({
    component,
    providers: [
      provideErrorTailorConfig({
        errors: {
          useValue: {
            required: () => 'required error',
            requireExplicit: () => 'required explicit error',
            minlength: () => 'min error',
            requiredone: () => 'required one error',
            serverError: (error) => error,
          },
        },
        controlErrorsClass: ['global', 'config'],
      }),
    ],
    imports: [FormsModule, ReactiveFormsModule, errorTailorImports],
  });
}

function typeInElementAndFocusOut(spectator: Spectator<any>, text: string, input: Element) {
  spectator.typeInElement(text, input);
  spectator.dispatchFakeEvent(input, 'focusout');
}

describe('ControlErrorDirective', () => {
  describe('FormGroup', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, errorTailorImports, CommonModule],
      template: `
        <form [formGroup]="form" errorTailor>
          <input formControlName="name" placeholder="Name" />
          <input type="checkbox" formControlName="terms" id="check" [controlErrorAnchor]="anchor" />
          <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>
          <input formControlName="ignored" placeholder="Ignored" controlErrorsIgnore />
          <input formControlName="explicit" placeholder="Explicit" #explicitErrorTailor="errorTailor" />
          <div formArrayName="names">
            @for (name of form.controls.names.controls; track name; let i = $index) {
              <div>
                <input [formControl]="name" placeholder="Name {{ i }}" />
              </div>
            }
          </div>
          <input formControlName="username" placeholder="Username" />
          <input formControlName="onSubmitOnly" placeholder="On submit only" [controlErrorsOnBlur]="false" />
          <input formControlName="onEveryChange" placeholder="On every change" [controlErrorsOnChange]="true" />
          <button type="submit">Submit</button>
        </form>
      `,
    })
    class FormGroupComponent {
      form = this.builder.group({
        name: this.createName(),
        terms: [false, Validators.requiredTrue],
        ignored: ['', Validators.required],
        explicit: [''],
        names: this.builder.array([this.createName(), this.createName()], this.validator),
        username: ['', Validators.required, this.usernameValidator.bind(this)],
        onSubmitOnly: ['', [Validators.required]],
        onEveryChange: ['', [Validators.required]],
      });

      @ViewChild('explicitErrorTailor', { static: true }) explicitErrorTailor: ControlErrorsDirective;

      constructor(private builder: UntypedFormBuilder) {}

      createName() {
        return new UntypedFormControl('', [Validators.required, Validators.minLength(3)]);
      }

      validator({ controls }: UntypedFormArray) {
        return controls.some((control) => control.valid) ? null : { requiredone: true };
      }

      usernameValidator(ctrl: AbstractControl): Observable<ValidationErrors | null> {
        return scheduled([ctrl.value], asyncScheduler).pipe(
          map((value) => {
            if (value === 'error') {
              return {
                serverError: 'async validation error',
              };
            }

            return null;
          }),
        );
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
      const usernameInput = spectator.query<HTMLInputElement>(byPlaceholder('Username'));
      typeInElementAndFocusOut(spectator, 'async', usernameInput);

      typeInElementAndFocusOut(spectator, 't', nameInput);

      expect(spectator.query(byText('min error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, '', nameInput);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'test', nameInput);

      const oneNameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name 0'));
      const oneNameInput1 = spectator.query<HTMLInputElement>(byPlaceholder('Name 1'));

      const onSubmitOnly = spectator.query<HTMLInputElement>(byPlaceholder('On submit only'));
      const onEveryChange = spectator.query<HTMLInputElement>(byPlaceholder('On every change'));
      typeInElementAndFocusOut(spectator, 'test', onSubmitOnly);
      typeInElementAndFocusOut(spectator, 'test', onEveryChange);

      spectator.click('button');

      expect(spectator.query(byText('required one error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'no error', oneNameInput);
      typeInElementAndFocusOut(spectator, 'no error2', oneNameInput1);
      spectator.click('input[type=checkbox]');

      expect(spectator.query(byText(/error/))).toBeNull();
    });

    it('should show errors only on submit when controlErrorsOnBlur is disabled', () => {
      const onSubmitOnly = spectator.query<HTMLInputElement>(byPlaceholder('On submit only'));

      typeInElementAndFocusOut(spectator, 'test', onSubmitOnly);

      expect(spectator.query(byText('required error'))).toBeFalsy();

      spectator.click('button');

      expect(spectator.query(byText('required error'))).toBeTruthy();
    });

    it('should show errors on every change when controlErrorsOnChange is enabled', () => {
      const onEveryChange = spectator.query<HTMLInputElement>(byPlaceholder('On every change'));

      expect(spectator.query(byText('required error'))).toBeFalsy();

      spectator.typeInElement('t', onEveryChange);
      expect(spectator.query(byText('required error'))).toBeFalsy();

      spectator.typeInElement('', onEveryChange);
      expect(spectator.query(byText('required error'))).toBeTruthy();

      spectator.typeInElement('t', onEveryChange);
      expect(spectator.query(byText('required error'))).toBeFalsy();
    });

    it('should not show errors on interactions', () => {
      const ignoredInput = spectator.query<HTMLInputElement>(byPlaceholder('Ignored'));

      typeInElementAndFocusOut(spectator, '', ignoredInput);

      expect(spectator.query(byText('required error'))).toBeFalsy();
    });

    it('should show/hide errors on programmatic access', () => {
      /**
       * Explicitly defined validator to simplify testing on unique conditions.
       */
      const requiredExplicit = (control: AbstractControl): ValidationErrors | null => {
        if (control.value || control.value === '') {
          return {
            requireExplicit: true,
          };
        }
        return null;
      };
      /**
       * The first step, check without setting the explicit required validator.
       */
      const shownErrorMessage = 'required explicit error';
      const explicitInput = spectator.query<HTMLInputElement>(byPlaceholder('Explicit'));
      typeInElementAndFocusOut(spectator, '', explicitInput);
      expect(spectator.query(byText(shownErrorMessage))).toBeFalsy();

      /**
       * Set the explicit required validator and check it again.
       */
      spectator.component.form.get('explicit').setValidators(requiredExplicit);
      typeInElementAndFocusOut(spectator, '', explicitInput);
      expect(spectator.query(byText(shownErrorMessage))).toBeTruthy();

      /**
       * Hide programmatically the shown error message and check.
       */
      spectator.component.explicitErrorTailor.hideError();
      spectator.detectChanges();
      const queryByTextFalsy = spectator.query(byText(shownErrorMessage));
      expect(queryByTextFalsy).toBeFalsy();

      /**
       * Show programmatically the shown error message again and check.
       */
      spectator.component.explicitErrorTailor.showError();
      spectator.detectChanges();
      const queryByTextTruthy = spectator.query(byText(shownErrorMessage));
      expect(queryByTextTruthy).toBeTruthy();
    });

    it('should show errors on async statusChanges', fakeAsync(() => {
      const serverError = 'server error';
      const nameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

      typeInElementAndFocusOut(spectator, 'no error', nameInput);

      expect(spectator.query(byText(serverError))).toBeFalsy();

      spectator.click('button');

      setTimeout(() => {
        const control = spectator.component.form.get('name');

        control.setErrors({ serverError });
      }, 50);

      tick(50);

      spectator.detectChanges();

      expect(spectator.query(byText(serverError))).toBeTruthy();
    }));

    it('should show errors from async validators', fakeAsync(() => {
      const serverError = 'async validation error';
      const usernameInput = spectator.query<HTMLInputElement>(byPlaceholder('Username'));

      spectator.typeInElement('no error', usernameInput);

      tick();

      spectator.detectChanges();

      expect(spectator.query(byText(serverError))).toBeFalsy();

      spectator.typeInElement('error', usernameInput);

      tick();

      spectator.detectChanges();

      expect(spectator.query(byText(serverError))).toBeTruthy();

      spectator.typeInElement('no error', usernameInput);

      tick();

      spectator.detectChanges();

      expect(spectator.query(byText(serverError))).toBeFalsy();
    }));
  });

  describe('FormControl', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, errorTailorImports],
      template: ` <input [formControl]="name" placeholder="Name" /> `,
    })
    class FormControlComponent {
      name = new UntypedFormControl('', [Validators.required, Validators.minLength(3)]);
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
      standalone: true,
      imports: [FormsModule, errorTailorImports],
      template: ` <input [(ngModel)]="name" placeholder="Name" required minlength="3" /> `,
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

  describe('common', () => {
    @Component({
      standalone: true,
      imports: [ReactiveFormsModule, errorTailorImports, CommonModule],
      template: `
        <form [formGroup]="form" errorTailor>
          <input formControlName="customErrors" placeholder="Custom errors" [controlErrors]="customErrors" />

          <ng-template #customTpl let-errors let-text="text">
            custom template {{ errors | json }} {{ text }}
          </ng-template>
          <input formControlName="customTemplate" placeholder="Custom template" [controlErrorsTpl]="customTpl" />

          <input
            formControlName="customClass"
            placeholder="Custom class"
            controlErrorsClass="customClass"
            controlCustomClass="customControlClass"
          />

          <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>
          <input formControlName="withAnchor" placeholder="With anchor" [controlErrorAnchor]="anchor" />

          <div controlErrorAnchor>
            <input formControlName="withParentAnchor" placeholder="With parent anchor" />
          </div>
        </form>
      `,
    })
    class CommonFormGroupComponent {
      form = this.builder.group({
        customErrors: new UntypedFormControl('', [Validators.required, Validators.minLength(3)]),
        customTemplate: ['', Validators.required],
        customClass: ['', Validators.required],
        withAnchor: ['', Validators.required],
        withParentAnchor: ['', Validators.required],
      });

      customErrors = {
        required: 'custom required error',
      };

      constructor(private builder: UntypedFormBuilder) {}
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

    it('should set custom class for control when it is provided', () => {
      const input = spectator.query<HTMLInputElement>(byPlaceholder('Custom class'));

      typeInElementAndFocusOut(spectator, '', input);

      expect(spectator.query('.customControlClass')).toBeTruthy();
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
  });

  describe('GlobalConfig', () => {
    const customValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null =>
      control.value === 'custom' ? { custom: control.value } : null;

    @Component({
      selector: 'custom-error-form-group',
      standalone: true,
      imports: [ReactiveFormsModule, errorTailorImports, CommonModule],
      template: `
        <form [formGroup]="form" errorTailor>
          @if (showName) {
            <input formControlName="name" placeholder="Name" />
          }
        </form>
      `,
    })
    class CustomErrorFormGroupComponent {
      form = this.builder.group({
        name: new UntypedFormControl('', [Validators.required, customValidator]),
      });
      showName = true;
      constructor(private builder: UntypedFormBuilder) {}
    }

    @Component({
      standalone: true,
      selector: 'custom-error-component',
      template: ` <h1>{{ errorText }}</h1> `,
    })
    class CustomControlErrorComponent extends DefaultControlErrorComponent {}

    function getCustomErrorComponentFactory<C>(
      component: Type<C>,
      controlErrorComponentAnchorFn: (hostElem: Element, errorElem: Element) => () => void = null,
    ) {
      return createComponentFactory({
        component,
        providers: [
          provideErrorTailorConfig({
            errors: {
              useValue: {
                required: () => 'required error',
                custom: () => {
                  const controlName = inject(NgControl).name;
                  return `custom error for control ${controlName}`;
                },
              },
            },
            controlErrorsClass: ['global', 'config'],
            controlCustomClass: 'control custom',
            controlErrorComponent: CustomControlErrorComponent,
            controlErrorComponentAnchorFn,
            controlErrorsOn: {
              change: true,
            },
          }),
        ],
        imports: [FormsModule, CustomControlErrorComponent, ReactiveFormsModule, errorTailorImports],
      });
    }

    describe('CustomControlErrorComponent', () => {
      let spectator: Spectator<CustomErrorFormGroupComponent>;
      const createComponent = getCustomErrorComponentFactory(CustomErrorFormGroupComponent);

      beforeEach(() => (spectator = createComponent()));

      it('should create custom error component', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        typeInElementAndFocusOut(spectator, '', input);

        expect(spectator.query('h1')).toBeTruthy();
        expect(spectator.query(byText('required error'))).toBeTruthy();
      });

      it('should set global custom class when it is provided', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        typeInElementAndFocusOut(spectator, '', input);

        expect(spectator.query('.global.config')).toBeTruthy();
      });

      it('should set global custom class for component when it is provided', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        typeInElementAndFocusOut(spectator, '', input);

        expect(spectator.query('.control.custom')).toBeTruthy();
      });
    });

    describe('ErrorComponentAnchorFnCallback', () => {
      let anchorFnCalled = false;
      let anchorFnDestroyCalled = false;

      let spectator: Spectator<CustomErrorFormGroupComponent>;
      const createComponent = getCustomErrorComponentFactory(
        CustomErrorFormGroupComponent,
        (hostElem: Element, errorElem: Element) => {
          anchorFnCalled = true;
          expect(hostElem).toBeTruthy();
          expect(errorElem).toBeTruthy();
          return () => {
            anchorFnDestroyCalled = true;
          };
        },
      );

      beforeEach(() => (spectator = createComponent()));

      it('should call error component anchor fn', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        typeInElementAndFocusOut(spectator, '', input);

        expect(anchorFnCalled).toBeTruthy();
      });

      it('should call error component anchor fn destroy callback', () => {
        anchorFnCalled = false; // reset values, just to be safe
        anchorFnDestroyCalled = false;

        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));
        typeInElementAndFocusOut(spectator, '', input);
        expect(anchorFnCalled).toBeTruthy();

        // This will remove the name input field, which should also remove the
        // custom control error component created earlier. And removal of the
        // custom control error component, should result in a call to the anchor function's
        // destroy callback.
        spectator.component.showName = false;
        spectator.detectChanges();
        expect(anchorFnDestroyCalled).toBeTruthy();
      });
    });

    describe('controlErrorsOn', () => {
      let spectator: Spectator<CustomErrorFormGroupComponent>;
      const createComponent = getCustomErrorComponentFactory(CustomErrorFormGroupComponent);

      beforeEach(() => (spectator = createComponent()));

      it('should override default behavior for showing errors', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        expect(spectator.query(byText('required error'))).toBeFalsy();

        spectator.typeInElement('test', input);
        expect(spectator.query(byText('required error'))).toBeFalsy();

        spectator.typeInElement('', input);
        expect(spectator.query(byText('required error'))).toBeTruthy();

        spectator.typeInElement('t', input);
        expect(spectator.query(byText('required error'))).toBeFalsy();
      });
    });

    describe('errors', () => {
      let spectator: Spectator<CustomErrorFormGroupComponent>;
      const createComponent = getCustomErrorComponentFactory(CustomErrorFormGroupComponent);

      beforeEach(() => (spectator = createComponent()));

      it('should be able to access directive injector', () => {
        const input = spectator.query<HTMLInputElement>(byPlaceholder('Name'));

        spectator.typeInElement('custom', input);
        expect(spectator.query(byText('custom error for control name'))).toBeTruthy();
      });
    });
  });
});
