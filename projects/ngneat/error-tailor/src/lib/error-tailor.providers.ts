import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { DefaultControlErrorComponent } from './control-error.component';
import { ControlErrorsDirective } from './control-error.directive';
import { FormActionDirective } from './form-action.directive';
import { ErrorTailorConfig, ErrorTailorConfigProvider, FORM_ERRORS } from './providers';

export const errorTailorImports = [
  ControlErrorsDirective,
  ControlErrorAnchorDirective,
  DefaultControlErrorComponent,
  FormActionDirective
];

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
