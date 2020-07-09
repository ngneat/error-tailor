import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { DefaultControlErrorComponent } from '@ngneat/error-tailor';

@Component({
  selector: 'custom-control-error',
  template: `
    <div class="control-error" [class.hide-control]="hide" *ngIf="!_tpl">
      <h3>{{ _text }}</h3>
    </div>
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
export class CustomControlErrorComponent extends DefaultControlErrorComponent {}
