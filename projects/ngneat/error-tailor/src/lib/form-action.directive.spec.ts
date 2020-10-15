import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { FormActionDirective } from './form-action.directive';

describe('FormActionDirective', () => {
  let spectator: SpectatorDirective<FormActionDirective>;
  const createDirective = createDirectiveFactory(FormActionDirective);

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

  it('should emit submit when form is submitted and add class `form-submitted`', () => {
    let submitted = false;

    spectator.directive.submit$.subscribe({
      next: () => (submitted = true)
    });

    const form = spectator.query<HTMLButtonElement>('form');

    spectator.dispatchFakeEvent(form, 'submit');

    expect(submitted).toBeTrue();
    expect(form.classList.contains('form-submitted')).toBeTrue();
  });
});
