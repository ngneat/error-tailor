import {
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Inject,
  Input,
  isDevMode,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import { AbstractControl, ControlContainer, NgControl, ValidationErrors } from '@angular/forms';
import {
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  takeUntil,
  EMPTY,
  fromEvent,
  merge,
  NEVER,
  Observable,
  Subject,
  tap,
} from 'rxjs';

import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { ControlErrorComponent, DefaultControlErrorComponent } from './control-error.component';
import { FormActionDirective } from './form-action.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './error-tailor.providers';
import { ErrorsMap } from './types';

const errorTailorClass = 'error-tailor-has-error';

@Directive({
  standalone: true,
  selector:
    '[formControlName]:not([controlErrorsIgnore]), [formControl]:not([controlErrorsIgnore]), [formGroup]:not([controlErrorsIgnore]), [formGroupName]:not([controlErrorsIgnore]), [formArrayName]:not([controlErrorsIgnore]), [ngModel]:not([controlErrorsIgnore])',
  exportAs: 'errorTailor',
})
export class ControlErrorsDirective implements OnInit, OnDestroy {
  @Input('controlErrors') customErrors: ErrorsMap = {};
  @Input() controlErrorsClass: string | string[] | undefined;
  @Input() controlCustomClass: string | string[] | undefined;
  @Input() controlErrorsTpl: TemplateRef<any> | undefined;
  @Input() controlErrorsOnAsync: boolean | undefined;
  @Input() controlErrorsOnBlur: boolean | undefined;
  @Input() controlErrorsOnChange: boolean | undefined;
  @Input() controlErrorsOnStatusChange: boolean | undefined;
  @Input() controlErrorAnchor: ControlErrorAnchorDirective;

  private ref: ComponentRef<ControlErrorComponent>;
  private submit$: Observable<Event>;
  private reset$: Observable<Event>;
  private control: AbstractControl;
  private destroy = new Subject<void>();
  private mergedConfig: ErrorTailorConfig = {};
  private customAnchorDestroyFn: () => void;
  private host: HTMLElement;

  constructor(
    private vcr: ViewContainerRef,
    elementRef: ElementRef,
    @Inject(ErrorTailorConfigProvider) private config: ErrorTailorConfig,
    @Inject(FORM_ERRORS) private globalErrors,
    @Optional() private controlErrorAnchorParent: ControlErrorAnchorDirective,
    @Optional() private form: FormActionDirective,
    @Optional() @Self() private ngControl: NgControl,
    @Optional() @Self() private controlContainer: ControlContainer,
  ) {
    this.host = elementRef.nativeElement as HTMLElement;
    this.submit$ = this.form ? this.form.submit$ : EMPTY;
    this.reset$ = this.form ? this.form.reset$ : EMPTY;
  }

  ngOnInit() {
    this.mergedConfig = this.buildConfig();

    this.control = (this.controlContainer || this.ngControl).control;
    const hasAsyncValidator = !!this.control.asyncValidator;

    const statusChanges$ = this.control.statusChanges.pipe(distinctUntilChanged());
    const valueChanges$ = this.control.valueChanges;
    const controlChanges$ = merge(statusChanges$, valueChanges$);
    let changesOnAsync$: Observable<any> = EMPTY;
    let changesOnBlur$: Observable<any> = EMPTY;
    let changesOnChange$: Observable<any> = EMPTY;
    let changesOnStatusChange$: Observable<any> = EMPTY;

    if (!this.controlErrorsClass || this.controlErrorsClass?.length === 0) {
      if (this.mergedConfig.controlErrorsClass && this.mergedConfig.controlErrorsClass) {
        this.controlErrorsClass = this.mergedConfig.controlErrorsClass;
      }
    }

    if (!this.controlCustomClass || this.controlCustomClass?.length === 0) {
      if (this.mergedConfig.controlCustomClass && this.mergedConfig.controlCustomClass) {
        this.controlCustomClass = this.mergedConfig.controlCustomClass;
      }
    }

    if (this.mergedConfig.controlErrorsOn.async && hasAsyncValidator) {
      // hasAsyncThenUponStatusChange
      changesOnAsync$ = statusChanges$;
    }

    if (this.isInput && this.mergedConfig.controlErrorsOn.change) {
      // on each change
      changesOnChange$ = valueChanges$;
    }

    if (this.mergedConfig.controlErrorsOn.status) {
      changesOnStatusChange$ = statusChanges$;
    }

    if (this.isInput && this.mergedConfig.controlErrorsOn.blur) {
      const blur$ = fromEvent(this.host, 'focusout');
      // blurFirstThenUponChange
      changesOnBlur$ = blur$.pipe(switchMap(() => valueChanges$.pipe(startWith(true))));
    }

    const submit$ = merge(
      this.submit$.pipe(map(() => true)),
      this.reset$.pipe(
        map(() => false),
        tap(() => this.hideError()),
      ),
    );

    // when submitted, submitFirstThenUponChanges
    const changesOnSubmit$ = submit$.pipe(
      switchMap((submit) => (submit ? controlChanges$.pipe(startWith(true)) : NEVER)),
    );

    // on reset, clear ComponentRef and customAnchorDestroyFn
    this.reset$.pipe(takeUntil(this.destroy)).subscribe(() => this.clearRefs());

    merge(changesOnAsync$, changesOnBlur$, changesOnChange$, changesOnSubmit$, changesOnStatusChange$)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => {
        const hasErrors = !!this.control.errors;
        if (hasErrors) {
          this.showError();
        } else {
          this.hideError();
        }
      });
  }

  private setError(text: string, error?: ValidationErrors) {
    if (this.mergedConfig.controlClassOnly) {
      return;
    }

    this.ref ??= this.resolveAnchor().createComponent<ControlErrorComponent>(this.mergedConfig.controlErrorComponent);
    const instance = this.ref.instance;

    if (this.controlErrorsTpl) {
      instance.createTemplate(this.controlErrorsTpl, error, text);
    } else {
      instance.text = text;
    }

    if (this.controlErrorsClass) {
      instance.customClass = this.controlErrorsClass;
    }

    if (!this.controlErrorAnchor && this.mergedConfig.controlErrorComponentAnchorFn) {
      this.customAnchorDestroyFn = this.mergedConfig.controlErrorComponentAnchorFn(
        this.host,
        (this.ref.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement,
      );
    }
  }

  /**
   * Explicit showing of a control error via some custom application code.
   */
  showError(): void {
    const controlErrors = this.control.errors;
    if (controlErrors) {
      const [firstKey] = Object.keys(controlErrors);
      const getError = this.customErrors[firstKey] || this.globalErrors[firstKey];
      if (!getError) {
        if (isDevMode()) {
          console.warn(`[@ngneat/error-tailor]: Missing error message for ${firstKey}`);
        }
        return;
      }

      const text = typeof getError === 'function' ? getError(controlErrors[firstKey]) : getError;
      this.addCustomClass();
      this.setError(text, controlErrors);
    }
  }

  /**
   * Explicit hiding of a control error via some custom application code.
   */
  hideError(): void {
    this.removeCustomClass();
    if (this.ref) {
      this.setError(null);
    }
  }

  ngOnDestroy() {
    this.destroy.next();
    this.clearRefs();
  }

  private get customClasses() {
    return Array.isArray(this.controlCustomClass)
      ? this.controlCustomClass
      : this.controlCustomClass?.split(/\s/) ?? [];
  }

  private get isInput() {
    return this.mergedConfig.blurPredicate(this.host);
  }

  private clearRefs(): void {
    if (this.customAnchorDestroyFn) {
      this.customAnchorDestroyFn();
      this.customAnchorDestroyFn = null;
    }
    this.ref?.destroy();
    this.ref = null;
  }

  private resolveAnchor() {
    if (this.controlErrorAnchor) {
      return this.controlErrorAnchor.vcr;
    }

    if (this.controlErrorAnchorParent) {
      return this.controlErrorAnchorParent.vcr;
    }
    return this.vcr;
  }

  private buildConfig(): ErrorTailorConfig {
    return {
      ...{
        blurPredicate(element) {
          return element.tagName === 'INPUT' || element.tagName === 'SELECT';
        },
        controlErrorComponent: DefaultControlErrorComponent,
      },

      ...this.config,

      controlErrorsOn: {
        async: this.controlErrorsOnAsync ?? this.config.controlErrorsOn?.async ?? true,
        blur: this.controlErrorsOnBlur ?? this.config.controlErrorsOn?.blur ?? true,
        change: this.controlErrorsOnChange ?? this.config.controlErrorsOn?.change ?? false,
        status: this.controlErrorsOnStatusChange ?? this.config.controlErrorsOn?.status ?? false,
      },
    };
  }

  private addCustomClass() {
    if (this.isInput) {
      this.host.parentElement.classList.add(errorTailorClass);
      if (this.controlCustomClass) {
        this.host.classList.add(...this.customClasses);
      }
    }
  }

  private removeCustomClass() {
    if (this.isInput) {
      this.host.parentElement.classList.remove(errorTailorClass);
      if (this.controlCustomClass) {
        this.host.classList.remove(...this.customClasses);
      }
    }
  }
}
