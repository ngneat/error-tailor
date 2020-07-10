import { ModuleWithProviders, NgModule } from '@angular/core';
import { ControlErrorsDirective } from './control-error.directive';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { DefaultControlErrorComponent } from './control-error.component';
import { CommonModule } from '@angular/common';
import { FormSubmitDirective } from './form-submit.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';

const api = [DefaultControlErrorComponent, ControlErrorAnchorDirective, ControlErrorsDirective, FormSubmitDirective];

@NgModule({
  declarations: [
    ControlErrorsDirective,
    ControlErrorAnchorDirective,
    DefaultControlErrorComponent,
    FormSubmitDirective
  ],
  imports: [CommonModule],
  exports: [api],
  entryComponents: [DefaultControlErrorComponent]
})
export class ErrorTailorModule {
  static forRoot(config: ErrorTailorConfig = {}): ModuleWithProviders {
    return {
      ngModule: ErrorTailorModule,
      providers: [
        {
          provide: ErrorTailorConfigProvider,
          useValue: config
        },
        {
          provide: FORM_ERRORS,
          ...config.errors
        } as any
      ]
    };
  }
}
