import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef } from '@angular/core';
import { DefaultControlErrorComponent } from '@ngneat/error-tailor';

@Component({
  selector: 'custom-control-error',
  template: `
    @if (!errorTemplate) {
      <div class="control-error" [class.hide-control]="hideError">
        <h3>{{ errorText }}</h3>
      </div>
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
export class CustomControlErrorComponent extends DefaultControlErrorComponent {}
