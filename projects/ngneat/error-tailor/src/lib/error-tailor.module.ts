import { NgModule } from '@angular/core';
import { ControlErrorAnchorDirective } from './control-error-anchor.directive';
import { DefaultControlErrorComponent } from './control-error.component';
import { ControlErrorsDirective } from './control-error.directive';
import { FormActionDirective } from './form-action.directive';

const _errorTailorImports = [
  ControlErrorsDirective,
  ControlErrorAnchorDirective,
  DefaultControlErrorComponent,
  FormActionDirective,
];

@NgModule({
  imports: [_errorTailorImports],
  exports: [_errorTailorImports],
})
export class errorTailorImports {}
