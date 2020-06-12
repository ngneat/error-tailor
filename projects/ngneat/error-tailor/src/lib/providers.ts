import { InjectionToken, ValueSansProvider, FactorySansProvider } from '@angular/core';
import { ErrorsMap } from './types';

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
};

export const ErrorTailorConfigProvider = new InjectionToken<ErrorTailorConfig>('ErrorTailorConfigProvider');
