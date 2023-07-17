import { FactorySansProvider, InjectionToken, Type, ValueSansProvider } from '@angular/core';
import { ErrorsMap } from './types';
import { ControlErrorComponent } from './control-error.component';

export const FORM_ERRORS = new InjectionToken('FORM_ERRORS', {
  providedIn: 'root',
  factory: () => {
    return {};
  },
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
  controlErrorsClass?: string | string[] | undefined;
  controlCustomClass?: string | string[] | undefined;
  controlErrorComponent?: Type<ControlErrorComponent>;
  controlClassOnly?: boolean;
  controlErrorComponentAnchorFn?: (hostElement: Element, errorElement: Element) => () => void;
  controlErrorsOn?: {
    async?: boolean;
    blur?: boolean;
    change?: boolean;
    status?: boolean;
  };
};

export const ErrorTailorConfigProvider = new InjectionToken<ErrorTailorConfig>('ErrorTailorConfigProvider');

export function provideErrorTailorConfig(config: ErrorTailorConfig) {
  return [
    {
      provide: ErrorTailorConfigProvider,
      useValue: config,
    },
    {
      provide: FORM_ERRORS,
      ...config.errors,
    },
  ];
}
