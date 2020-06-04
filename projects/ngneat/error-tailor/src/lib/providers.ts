import { InjectionToken, Provider } from '@angular/core';

export const FORM_ERRORS = new InjectionToken('FORM_ERRORS', {
  providedIn: 'root',
  factory: () => {
    return {};
  }
});

export type ErrorTailorConfig = {
  errors?: Partial<Provider>;
  inputPredicate?: (element: Element) => boolean;
};

export const ErrorTailorConfigProvider = new InjectionToken<ErrorTailorConfig>('ErrorTailorConfigProvider');
