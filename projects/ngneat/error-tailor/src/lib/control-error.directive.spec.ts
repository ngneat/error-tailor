import { Component, Type, ViewChild, ViewChildren, QueryList } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { byPlaceholder, byText, createComponentFactory, Spectator } from '@ngneat/spectator';
import { ControlErrorsDirective, ErrorTailorModule } from '@ngneat/error-tailor';
import { tick, fakeAsync } from '@angular/core/testing';
import { DefaultControlErrorComponent } from './control-error.component';
import { Observable, asyncScheduler, scheduled } from 'rxjs';
import { map } from 'rxjs/operators';

function getComponentFactory<C>(component: Type<C>) {
  return createComponentFactory({
    component,
    imports: [
      FormsModule,
      ReactiveFormsModule,
      ErrorTailorModule.forRoot({
        errors: {
          useValue: {
            required: () => 'required error',
            minlength: () => 'min error',
            requiredone: () => 'required one error',
            serverError: error => error
          }
        }
      })
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

          <input formControlName="ignored" placeholder="Ignored" controlErrorsIgnore />

          <input formControlName="explicit" placeholder="Explicit" #explicitErrorTailor="errorTailor" />

          <div formArrayName="names">
            <div *ngFor="let name of form.controls.names.controls; index as i">
              <input [formControl]="name" placeholder="Name {{ i }}" />
            </div>
          </div>

          <input formControlName="username" placeholder="Username" />

          <button type="submit">Submit</button>
        </form>
      `
    })
    class FormGroupComponent {
      form = this.builder.group({
        name: this.createName(),
        terms: [false, Validators.requiredTrue],
        ignored: ['', Validators.required],
        explicit: [''],
        names: this.builder.array([this.createName(), this.createName()], this.validator),
        username: ['', null, this.usernameValidator.bind(this)]
      });

      @ViewChild('explicitErrorTailor', { static: true }) explicitErrorTailor: ControlErrorsDirective;

      constructor(private builder: FormBuilder) {}

      createName() {
        return new FormControl('', [Validators.required, Validators.minLength(3)]);
      }

      validator({ controls }: FormArray) {
        return controls.some(control => control.valid) ? null : { requiredone: true };
      }

      usernameValidator(ctrl: AbstractControl): Observable<ValidationErrors | null> {
        return scheduled([ctrl.value], asyncScheduler).pipe(
          map(value => {
            if (value === 'error') {
              return {
                serverError: 'async validation error'
              };
            }

            return null;
          })
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

      typeInElementAndFocusOut(spectator, 't', nameInput);

      expect(spectator.query(byText('min error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, '', nameInput);

      expect(spectator.query(byText('required error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'test', nameInput);

      const oneNameInput = spectator.query<HTMLInputElement>(byPlaceholder('Name 0'));
      const oneNameInput1 = spectator.query<HTMLInputElement>(byPlaceholder('Name 1'));

      spectator.click('button');

      expect(spectator.query(byText('required one error'))).toBeTruthy();

      typeInElementAndFocusOut(spectator, 'no error', oneNameInput);
      typeInElementAndFocusOut(spectator, 'no error2', oneNameInput1);
      spectator.click('input[type=checkbox]');

      expect(spectator.query(byText(/error/))).toBeNull();
    });

    it('should not show errors on interactions', () => {
      const ignoredInput = spectator.query<HTMLInputElement>(byPlaceholder('Ignored'));

      typeInElementAndFocusOut(spectator, '', ignoredInput);

      expect(spectator.query(byText('required error'))).toBeFalsy();
    });

    it('should show errors on programmatic access', () => {
      const explicitInput = spectator.query<HTMLInputElement>(byPlaceholder('Explicit'));
      typeInElementAndFocusOut(spectator, '', explicitInput);
      expect(spectator.query(byText('required error'))).toBeFalsy();

      spectator.component.form.get('explicit').setValidators(Validators.required);
      typeInElementAndFocusOut(spectator, '', explicitInput);
      expect(spectator.query(byText('required error'))).toBeTruthy();

      spectator.component.explicitErrorTailor.hideError();
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
  });

  describe('GlobalConfig', () => {
    @Component({
      selector: 'custom-error-form-group',
      template: `
        <form [formGroup]="form" errorTailor>
          <input formControlName="name" placeholder="Name" *ngIf="showName" />
        </form>
      `
    })
    class CustomErrorFormGroupComponent {
      form = this.builder.group({
        name: new FormControl('', [Validators.required])
      });
      showName = true;
      constructor(private builder: FormBuilder) {}
    }

    @Component({
      selector: 'custom-error-component',
      template: `
        <h1>{{ errorText }}</h1>
      `
    })
    class CustomControlErrorComponent extends DefaultControlErrorComponent {}

    function getCustomErrorComponentFactory<C>(
      component: Type<C>,
      controlErrorComponentAnchorFn: (hostElem: Element, errorElem: Element) => () => void = null
    ) {
      return createComponentFactory({
        component,
        declarations: [CustomControlErrorComponent],
        imports: [
          FormsModule,
          ReactiveFormsModule,
          ErrorTailorModule.forRoot({
            errors: {
              useValue: {
                required: () => 'required error'
              }
            },
            controlErrorComponent: CustomControlErrorComponent,
            controlErrorComponentAnchorFn: controlErrorComponentAnchorFn
          })
        ]
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
        }
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
  });
});
