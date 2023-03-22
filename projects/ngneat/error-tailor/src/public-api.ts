/*
 * Public API Surface of error-tailor
 */

export { provideErrorTailorConfig, errorTailorImports } from './lib/error-tailor.providers';
export {
  ControlErrorComponent,
  ErrorComponentTemplate,
  DefaultControlErrorComponent
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
  ErrorsUseFactory
} from './lib/providers';
