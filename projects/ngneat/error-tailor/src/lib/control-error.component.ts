import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  TemplateRef,
  inject,
  signal,
} from '@angular/core';
import { ValidationErrors } from '@angular/forms';

export type ErrorComponentTemplate = TemplateRef<{ $implicit: ValidationErrors; text: string }>;

export interface ControlErrorComponent {
  customClass: string | string[];
  text: string | null;
  createTemplate?(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string): void;
}

@Component({
  selector: 'control-error',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (!errorTemplate) {
      <label class="control-error" [class.hide-control]="hideError">{{ errorText }}</label>
    }
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
    `,
  ],
})
export class DefaultControlErrorComponent implements ControlErrorComponent {
  errorText: string | null = null;
  errorTemplate: ErrorComponentTemplate | undefined;
  errorContext: { $implicit: ValidationErrors; text: string };
  hideError = true;

  private cdr = inject(ChangeDetectorRef);
  private host: ElementRef<HTMLElement> = inject(ElementRef);
  private _addClasses: string[] = [];

  createTemplate(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string) {
    this.errorTemplate = tpl;
    this.errorContext = { $implicit: error, text };
    this.cdr.markForCheck();
  }

  set customClass(classes: string | string[]) {
    if (!this.hideError) {
      this._addClasses = Array.isArray(classes) ? classes : classes.split(/\s/);
      this.host.nativeElement.classList.add(...this._addClasses);
    }
  }

  set text(value: string | null) {
    if (value !== this.errorText) {
      this.errorText = value;
      this.hideError = !value;

      if (this.hideError) {
        this.host.nativeElement.classList.remove(...this._addClasses);
      }
      this.cdr.markForCheck();
    }
  }
}
