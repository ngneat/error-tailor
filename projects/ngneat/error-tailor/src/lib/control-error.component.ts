import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, TemplateRef } from '@angular/core';
import { ValidationErrors } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

export type ErrorComponentTemplate = TemplateRef<{ $implicit: ValidationErrors; text: string }>;

export interface ControlErrorComponent {
  customClass: string;
  text$: Observable<string> | null;
  createTemplate?(tpl: ErrorComponentTemplate, error: ValidationErrors, text$: Observable<string>): void;
}

@Component({
  selector: 'control-error',
  template: `
    <label class="control-error" [class.hide-control]="hideError" *ngIf="!errorTemplate">{{
      errorText$ | async
    }}</label>
    <ng-template *ngTemplateOutlet="errorTemplate; context: errorContext"></ng-template>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [
    `
      .hide-control {
        display: none !important;
      }

      :host {
        display: block;
      }
    `
  ]
})
export class DefaultControlErrorComponent implements ControlErrorComponent {
  errorText$: Observable<string> | null = null;
  errorTemplate: ErrorComponentTemplate | undefined;
  errorContext: { $implicit: ValidationErrors; text$: Observable<string> };
  hideError = true;

  createTemplate(tpl: ErrorComponentTemplate, error: ValidationErrors, text$: Observable<string>) {
    this.errorTemplate = tpl;
    this.errorContext = { $implicit: error, text$ };
    this.cdr.markForCheck();
  }

  set customClass(className: string) {
    this.host.nativeElement.classList.add(className);
  }

  set text$(value: Observable<string> | null) {
    this.errorText$ = (value || of(null)).pipe(
      tap(val => {
        this.hideError = !val;
        this.cdr.detectChanges();
      })
    );
    this.cdr.markForCheck();
  }

  constructor(private cdr: ChangeDetectorRef, private host: ElementRef<HTMLElement>) {}
}
