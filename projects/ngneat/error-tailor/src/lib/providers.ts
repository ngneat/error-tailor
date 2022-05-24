import { InjectionToken, ValueSansProvider, FactorySansProvider, Type } from '@angular/core';
import { ErrorsMap } from './types';
import { ControlErrorComponent } from './control-error.component';

export const FORM_ERRORS = new InjectionToken('FORM_ERRORS', {
  providedIn: 'root',
  factory: () => {
    return {};
  }
});

export interface ErrorsUseValue extends ValueSansProvider {
  useValue: ErrorsMap;
}

export interface ErrorsUseFactory extends FactorySansProvider {
  useFactory: (...args: any[]) => ErrorsMap;
}

export type ErrorsProvider = ErrorsUseValue | ErrorsUseFactory;

export type ErrorTailorConfig = {
  errors?: ErrorsProvider;
  blurPredicate?: (element: Element) => boolean;
  controlErrorComponent?: Type<ControlErrorComponent>;
  controlErrorComponentAnchorFn?: (hostElement: Element, errorElement: Element) => () => void;
  controlErrorsOn?: {
    async?: boolean;
    blur?: boolean;
    change?: boolean;
  };
};

export const ErrorTailorConfigProvider = new InjectionToken<ErrorTailorConfig>('ErrorTailorConfigProvider');
