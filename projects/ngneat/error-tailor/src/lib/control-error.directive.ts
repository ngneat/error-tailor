import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  ElementRef,
  Inject,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Self,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef
} from '@angular/core';
import { AbstractControl, ControlContainer, NgControl, ValidationErrors } from '@angular/forms';
import { DefaultControlErrorComponent, ControlErrorComponent } from './control-error.component';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { EMPTY, fromEvent, merge, Observable, Subject } from 'rxjs';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';
import { distinctUntilChanged, startWith, switchMap, takeUntil } from 'rxjs/operators';
import { FormSubmitDirective } from './form-submit.directive';
import { ErrorsMap } from './types';

@Directive({
  selector:
    '[formControlName]:not([controlErrorsIgnore]), [formControl]:not([controlErrorsIgnore]), [formGroup]:not([controlErrorsIgnore]), [formGroupName]:not([controlErrorsIgnore]), [formArrayName]:not([controlErrorsIgnore]), [ngModel]:not([controlErrorsIgnore])',
  exportAs: 'errorTailor'
})
export class ControlErrorsDirective implements OnInit, OnDestroy {
  @Input('controlErrors') customErrors: ErrorsMap = {};
  @Input() controlErrorsClass: string | undefined;
  @Input() controlErrorsTpl: TemplateRef<any> | undefined;
  @Input() controlErrorsOnAsync = true;
  @Input() controlErrorsOnBlur = true;
  @Input() controlErrorAnchor: ControlErrorAnchorDirective;

  private ref: ComponentRef<ControlErrorComponent>;
  private anchor: ViewContainerRef;
  private submit$: Observable<Event>;
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
    @Optional() private form: FormSubmitDirective,
    @Optional() @Self() private ngControl: NgControl,
    @Optional() @Self() private controlContainer: ControlContainer
  ) {
    this.submit$ = this.form ? this.form.submit$ : EMPTY;
    this.mergedConfig = this.buildConfig();
  }

  ngOnInit() {
    this.anchor = this.resolveAnchor();
    this.control = (this.controlContainer || this.ngControl).control;
    const hasAsyncValidator = !!this.control.asyncValidator;
    const isInput = this.mergedConfig.blurPredicate(this.host.nativeElement);

    const statusChanges$ = this.control.statusChanges.pipe(distinctUntilChanged());
    const valueChanges$ = this.control.valueChanges;
    const controlChanges$ = merge(statusChanges$, valueChanges$);
    let changesOnAsync$: Observable<any> = EMPTY;
    let changesOnBlur$: Observable<any> = EMPTY;

    if (this.controlErrorsOnAsync && hasAsyncValidator) {
      // hasAsyncThenUponStatusChange
      changesOnAsync$ = statusChanges$.pipe(startWith(true));
    }

    if (this.controlErrorsOnBlur && isInput) {
      const blur$ = fromEvent(this.host.nativeElement, 'focusout');
      // blurFirstThenUponChange
      changesOnBlur$ = blur$.pipe(switchMap(() => valueChanges$.pipe(startWith(true))));
    }

    // submitFirstThenUponChanges
    const changesOnSubmit$ = this.submit$.pipe(switchMap(() => controlChanges$.pipe(startWith(true))));

    merge(changesOnAsync$, changesOnBlur$, changesOnSubmit$, this.showError$)
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

    if (this.mergedConfig.controlErrorComponentAnchorFn) {
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
    if (this.customAnchorDestroyFn) {
      this.customAnchorDestroyFn();
      this.customAnchorDestroyFn = null;
    }
    if (this.ref) this.ref.destroy();
    this.ref = null;
  }

  private valueChanges() {
    const controlErrors = this.control.errors;
    if (controlErrors) {
      const [firstKey] = Object.keys(controlErrors);
      const getError = this.customErrors[firstKey] || this.globalErrors[firstKey];
      if (!getError) {
        return;
      }

      const text = typeof getError === 'function' ? getError(controlErrors[firstKey]) : getError;
      this.setError(text, controlErrors);
    } else if (this.ref) {
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
      ...this.config
    };
  }
}
