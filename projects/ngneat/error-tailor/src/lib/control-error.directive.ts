import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  EmbeddedViewRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  TemplateRef,
  ViewContainerRef
} from '@angular/core';
import { AbstractControl, ControlContainer, NgControl, ValidationErrors } from '@angular/forms';
import { EMPTY, fromEvent, merge, NEVER, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, mapTo, startWith, switchMap, takeUntil } from 'rxjs/operators';

import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { ControlErrorComponent, DefaultControlErrorComponent } from './control-error.component';
import { FormActionDirective } from './form-action.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';
import { ErrorsMap } from './types';

@Directive({
  selector:
    '[formControlName]:not([controlErrorsIgnore]), [formControl]:not([controlErrorsIgnore]), [formGroup]:not([controlErrorsIgnore]), [formGroupName]:not([controlErrorsIgnore]), [formArrayName]:not([controlErrorsIgnore]), [ngModel]:not([controlErrorsIgnore])',
  exportAs: 'errorTailor'
})
export class ControlErrorsDirective implements OnInit, OnDestroy {
  @Input('controlErrors') customErrors: ErrorsMap = {};
  @Input() controlErrorsClass: string | string[] | undefined;
  @Input() controlCustomClass: string | string[] | undefined;
  @Input() controlErrorsTpl: TemplateRef<any> | undefined;
  @Input() controlErrorsOnAsync: boolean | undefined;
  @Input() controlErrorsOnBlur: boolean | undefined;
  @Input() controlErrorsOnChange: boolean | undefined;
  @Input() controlErrorAnchor: ControlErrorAnchorDirective;

  private ref: ComponentRef<ControlErrorComponent>;
  private anchor: ViewContainerRef;
  private submit$: Observable<Event>;
  private reset$: Observable<Event>;
  private control: AbstractControl;
  private destroy = new Subject();
  private showError$ = new Subject();
  private mergedConfig: ErrorTailorConfig = {};
  private customAnchorDestroyFn: () => void;

  constructor(
    private vcr: ViewContainerRef,
    private resolver: ComponentFactoryResolver,
    private host: ElementRef,
    @Inject(ErrorTailorConfigProvider) private config: ErrorTailorConfig,
    @Inject(FORM_ERRORS) private globalErrors,
    @Optional() private controlErrorAnchorParent: ControlErrorAnchorDirective,
    @Optional() private form: FormActionDirective,
    @Optional() @Self() private ngControl: NgControl,
    @Optional() @Self() private controlContainer: ControlContainer
  ) {
    this.submit$ = this.form ? this.form.submit$ : EMPTY;
    this.reset$ = this.form ? this.form.reset$ : EMPTY;
  }

  ngOnInit() {
    console.log({ ...this.config });
    this.mergedConfig = this.buildConfig();

    this.anchor = this.resolveAnchor();
    this.control = (this.controlContainer || this.ngControl).control;
    const hasAsyncValidator = !!this.control.asyncValidator;

    const statusChanges$ = this.control.statusChanges.pipe(distinctUntilChanged());
    const valueChanges$ = this.control.valueChanges;
    const controlChanges$ = merge(statusChanges$, valueChanges$);
    let changesOnAsync$: Observable<any> = EMPTY;
    let changesOnBlur$: Observable<any> = EMPTY;
    let changesOnChange$: Observable<any> = EMPTY;

    if (!this.controlErrorsClass || this.controlErrorsClass?.length === 0) {
      if (this.mergedConfig.controlErrorsClass && this.mergedConfig.controlErrorsClass) {
        this.controlErrorsClass = this.mergedConfig.controlErrorsClass;
      }
    }

    if (this.mergedConfig.controlErrorsOn.async && hasAsyncValidator) {
      // hasAsyncThenUponStatusChange
      changesOnAsync$ = statusChanges$.pipe(startWith(true));
    }

    if (this.isInput && this.mergedConfig.controlErrorsOn.change) {
      // on each change
      changesOnChange$ = valueChanges$;
    }

    if (this.isInput && this.mergedConfig.controlErrorsOn.blur) {
      const blur$ = fromEvent(this.host.nativeElement, 'focusout');
      // blurFirstThenUponChange
      changesOnBlur$ = blur$.pipe(switchMap(() => valueChanges$.pipe(startWith(true))));
    }

    const submit$ = merge(this.submit$.pipe(mapTo(true)), this.reset$.pipe(mapTo(false)));

    // when submitted, submitFirstThenUponChanges
    const changesOnSubmit$ = submit$.pipe(
      switchMap(submit => (submit ? controlChanges$.pipe(startWith(true)) : NEVER))
    );

    // on reset, clear ComponentRef and customAnchorDestroyFn
    this.reset$.pipe(takeUntil(this.destroy)).subscribe(() => this.clearRefs());

    merge(changesOnAsync$, changesOnBlur$, changesOnChange$, changesOnSubmit$, this.showError$)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => this.valueChanges());
  }

  private setError(text: string, error?: ValidationErrors) {
    if (!this.ref) {
      const factory = this.resolver.resolveComponentFactory<ControlErrorComponent>(
        this.mergedConfig.controlErrorComponent
      );
      this.ref = this.anchor.createComponent<ControlErrorComponent>(factory);
    }
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
        this.host.nativeElement as HTMLElement,
        (this.ref.hostView as EmbeddedViewRef<any>).rootNodes[0] as HTMLElement
      );
    }
  }

  /**
   * Explicit showing of a control error via some custom application code.
   */
  showError(): void {
    this.showError$.next();
  }

  /**
   * Explicit hiding of a control error via some custom application code.
   */
  hideError(): void {
    this.setError(null);
  }

  ngOnDestroy() {
    this.destroy.next();
    this.clearRefs();
  }

  private get isInput() {
    return this.mergedConfig.blurPredicate(this.host.nativeElement);
  }

  private clearRefs(): void {
    if (this.customAnchorDestroyFn) {
      this.customAnchorDestroyFn();
      this.customAnchorDestroyFn = null;
    }
    if (this.ref) {
      this.ref.destroy();
    }
    this.ref = null;
  }

  private valueChanges() {
    const controlErrors = this.control.errors;
    const classesAdd = Array.isArray(this.controlCustomClass)
      ? this.controlCustomClass
      : this.controlCustomClass?.split(/\s/) ?? [];
    if (controlErrors) {
      const [firstKey] = Object.keys(controlErrors);
      const getError = this.customErrors[firstKey] || this.globalErrors[firstKey];
      if (!getError) {
        return;
      }

      const text = typeof getError === 'function' ? getError(controlErrors[firstKey]) : getError;
      if (this.isInput) {
        this.host.nativeElement.parentElement.classList.add('error-tailor-has-error');
        if (this.controlCustomClass) {
          (this.host.nativeElement as HTMLElement).classList.add(...classesAdd);
        }
      }
      this.setError(text, controlErrors);
    } else if (this.ref) {
      if (this.isInput) {
        this.host.nativeElement.parentElement.classList.remove('error-tailor-has-error');
        if (this.controlCustomClass) {
          (this.host.nativeElement as HTMLElement).classList.remove(...classesAdd);
        }
      }
      this.setError(null);
    }
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
        controlErrorComponent: DefaultControlErrorComponent
      },

      ...this.config,

      controlErrorsOn: {
        async: this.controlErrorsOnAsync ?? this.config.controlErrorsOn?.async ?? true,
        blur: this.controlErrorsOnBlur ?? this.config.controlErrorsOn?.blur ?? true,
        change: this.controlErrorsOnChange ?? this.config.controlErrorsOn?.change ?? false
      }
    };
  }
}
