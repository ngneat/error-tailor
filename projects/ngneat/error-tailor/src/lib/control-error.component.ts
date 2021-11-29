import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, TemplateRef } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

export type ErrorComponentTemplate = TemplateRef<{ $implicit: ValidationErrors; text: string }>;

export interface ControlErrorComponent {
  customClass: string | string[];
  text: string | null;
  createTemplate?(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string): void;
}

@Component({
  selector: 'control-error',
  template: `
    <label class="control-error" [class.hide-control]="hideError" *ngIf="!errorTemplate">{{ errorText }}</label>
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
  errorText: string | null = null;
  errorTemplate: ErrorComponentTemplate | undefined;
  errorContext: { $implicit: ValidationErrors; text: string };
  hideError = true;

  createTemplate(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string) {
    this.errorTemplate = tpl;
    this.errorContext = { $implicit: error, text };
    this.cdr.markForCheck();
  }

  set customClass(classes: string | string[]) {
    const classesToAdd = Array.isArray(classes) ? classes : classes.split(/\s/);
    this.host.nativeElement.classList.add(...classesToAdd);
  }

  set text(value: string | null) {
    if (value !== this.errorText) {
      this.errorText = value;
      this.hideError = !value;
      this.cdr.markForCheck();
    }
  }

  constructor(private cdr: ChangeDetectorRef, private host: ElementRef<HTMLElement>) {}
}
