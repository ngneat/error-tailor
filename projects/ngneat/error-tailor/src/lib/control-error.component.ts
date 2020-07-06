import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, TemplateRef } from '@angular/core';
import { ValidationErrors } from '@angular/forms';

export type ErrorComponentTemplate = TemplateRef<{ $implicit: ValidationErrors; text: string }>;

export interface ControlErrorComponent {
  customClass: string;
  text: string | null;
  createTemplate?(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string): void;
}

@Component({
  selector: 'control-error',
  template: `
    <label class="control-error" [class.hide-control]="hide" *ngIf="!_tpl">{{ _text }}</label>
    <ng-template *ngTemplateOutlet="_tpl; context: context"></ng-template>
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
  _text: string | null = null;
  _tpl: ErrorComponentTemplate | undefined;
  context: { $implicit: ValidationErrors; text: string };
  hide = true;

  createTemplate(tpl: ErrorComponentTemplate, error: ValidationErrors, text: string) {
    this._tpl = tpl;
    this.context = { $implicit: error, text };
    this.cdr.markForCheck();
  }

  set customClass(className: string) {
    this.host.nativeElement.classList.add(className);
  }

  set text(value: string | null) {
    if (value !== this._text) {
      this._text = value;
      this.hide = !value;
      this.cdr.markForCheck();
    }
  }

  constructor(private cdr: ChangeDetectorRef, private host: ElementRef<HTMLElement>) {}
}
