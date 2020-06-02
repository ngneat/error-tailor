import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, TemplateRef } from '@angular/core';
import { HashMap } from './types';

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
export class ControlErrorComponent {
  _text: string | null = null;
  _tpl: TemplateRef<{ $implicit: HashMap; text: string }> | undefined;
  context: { $implicit: HashMap; text: string };
  hide = true;

  createTemplate(tpl: TemplateRef<any>, error, text: string) {
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
