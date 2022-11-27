import { ModuleWithProviders, NgModule } from '@angular/core';
import { ControlErrorsDirective } from './control-error.directive';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { DefaultControlErrorComponent } from './control-error.component';
import { CommonModule } from '@angular/common';
import { FormActionDirective } from './form-action.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';

const api = [DefaultControlErrorComponent, ControlErrorAnchorDirective, ControlErrorsDirective, FormActionDirective];

@NgModule({
  declarations: [
    ControlErrorsDirective,
    ControlErrorAnchorDirective,
    DefaultControlErrorComponent,
    FormActionDirective
  ],
  imports: [CommonModule],
  exports: [api]
})
export class ErrorTailorModule {
  static forRoot(config: ErrorTailorConfig = {}): ModuleWithProviders<ErrorTailorModule> {
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
