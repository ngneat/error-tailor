import { NgModule } from '@angular/core';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { DefaultControlErrorComponent } from './control-error.component';
import { ControlErrorsDirective } from './control-error.directive';
import { FormActionDirective } from './form-action.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';

const _errorTailorImports = [
  ControlErrorsDirective,
  ControlErrorAnchorDirective,
  DefaultControlErrorComponent,
  FormActionDirective
];

@NgModule({
  imports: [_errorTailorImports],
  exports: [_errorTailorImports]
})
export class errorTailorImports {}

export function provideErrorTailorConfig(config: ErrorTailorConfig) {
  return [
    {
      provide: ErrorTailorConfigProvider,
      useValue: config
    },
    {
      provide: FORM_ERRORS,
      ...config.errors
    }
  ];
}
