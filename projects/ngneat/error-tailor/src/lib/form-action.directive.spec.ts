import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { FormActionDirective } from './form-action.directive';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('FormActionDirective', () => {
  let spectator: SpectatorDirective<FormActionDirective>;
  const createDirective = createDirectiveFactory({
    directive: FormActionDirective,
    schemas: [NO_ERRORS_SCHEMA]
  });

  beforeEach(() => {
    spectator = createDirective(`
      <form [formGroup]="form" errorTailor></form>
    `);
  });

  it('should create', () => {
    expect(spectator.directive).toBeTruthy();
  });

  it('host element should be the form element', () => {
    const form = spectator.query<HTMLFormElement>('form');
    expect(spectator.directive.element).toBe(form);
  });

  it('should emit reset when form is reset and remove class `form-submitted` after submit', () => {
    let reset = false;

    spectator.directive.reset$.subscribe({
      next: () => (reset = true)
    });

    const form = spectator.query<HTMLButtonElement>('form');

    spectator.dispatchFakeEvent(form, 'submit');

    spectator.detectChanges();

    spectator.dispatchFakeEvent(form, 'reset');

    expect(reset).toBeTrue();
    expect(form.classList.contains('form-submitted')).toBeFalse();
  });
});
