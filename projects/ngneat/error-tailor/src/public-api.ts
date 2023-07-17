/*
 * Public API Surface of error-tailor
 */

export { errorTailorImports } from './lib/error-tailor.module';
export {
  ControlErrorComponent,
  ErrorComponentTemplate,
  DefaultControlErrorComponent,
} from './lib/control-error.component';
export { ControlErrorAnchorDirective } from './lib/control-error-anchor.directive';
export { ControlErrorsDirective } from './lib/control-error.directive';
export { FormActionDirective } from './lib/form-action.directive';
export {
  ErrorTailorConfig,
  ErrorsUseValue,
  ErrorTailorConfigProvider,
  ErrorsProvider,
  FORM_ERRORS,
  ErrorsUseFactory,
  provideErrorTailorConfig,
} from './lib/error-tailor.providers';
