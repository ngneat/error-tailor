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
  ViewContainerRef
} from '@angular/core';
import { AbstractControl, ControlContainer, NgControl } from '@angular/forms';
import { ControlErrorComponent } from './control-error.component';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { EMPTY, fromEvent, merge, Observable, Subject } from 'rxjs';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';
import { startWith, switchMap, takeUntil } from 'rxjs/operators';
import { FormSubmitDirective } from './form-submit.directive';
import { HashMap } from './types';

@Directive({
  selector: '[formControlName], [formControl], [formGroup], [formGroupName], [formArrayName], [ngModel]'
})
export class ControlErrorsDirective implements OnInit, OnDestroy {
  @Input('controlErrors') customErrors: HashMap = {};
  @Input() controlErrorsClass: string | undefined;
  @Input() controlErrorsTpl: TemplateRef<any> | undefined;
  @Input() controlErrorsOnBlur = true;
  @Input() controlErrorAnchor: ControlErrorAnchorDirective;

  private ref: ComponentRef<ControlErrorComponent>;
  private anchor: ViewContainerRef;
  private submit$: Observable<Event>;
  private control: AbstractControl;
  private destroy = new Subject();
  private mergedConfig: ErrorTailorConfig = {};

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
    const isInput = this.mergedConfig.blurPredicate(this.host.nativeElement);

    const valueChanges$ = this.control.valueChanges;
    let changes$: Observable<any> = EMPTY;

    if (this.controlErrorsOnBlur && isInput) {
      const blur$ = fromEvent(this.host.nativeElement, 'focusout');
      // blurFirstThanUponChange
      changes$ = blur$.pipe(switchMap(() => valueChanges$.pipe(startWith(true))));
    }

    // submitFirstThanUponChanges
    const submit$ = this.submit$.pipe(switchMap(() => valueChanges$.pipe(startWith(true))));

    merge(submit$, changes$)
      .pipe(takeUntil(this.destroy))
      .subscribe(() => this.valueChanges());
  }

  private setError(text: string, error?: HashMap) {
    if (!this.ref) {
      const factory = this.resolver.resolveComponentFactory(ControlErrorComponent);
      this.ref = this.anchor.createComponent(factory);
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
  }

  ngOnDestroy() {
    this.destroy.next();
    if (this.ref) this.ref.destroy();
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
        }
      },
      ...this.config
    };
  }
}
