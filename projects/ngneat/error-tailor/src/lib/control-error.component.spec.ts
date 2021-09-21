import { Spectator, createComponentFactory, byText } from '@ngneat/spectator';

import { DefaultControlErrorComponent } from './control-error.component';
import { of } from 'rxjs';

describe('ControlErrorComponent', () => {
  let spectator: Spectator<DefaultControlErrorComponent>;
  const createComponent = createComponentFactory(DefaultControlErrorComponent);

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('when text is setted', () => {
    it('should show text error when it is setted', () => {
      spectator.component.text$ = of('test');

      spectator.detectChanges();

      expect(spectator.component.hideError).toBeFalse();
      expect(spectator.query(byText('test'))).toBeTruthy();
    });

    it('should hide text when error is empty', () => {
      spectator.component.text$ = of('test');

      spectator.detectChanges();

      spectator.component.text$ = of('');

      spectator.detectChanges();

      expect(spectator.component.hideError).toBeTrue();
      expect(spectator.query(byText('test'))).toBeNull();
    });

    it('should do nothing when text has not changed', () => {
      spectator.component.text$ = of('test');

      let setHasNotBeenCalled = true;

      Object.defineProperty(spectator.component, '_text', {
        get() {
          return 'test';
        },
        set() {
          setHasNotBeenCalled = false;
        }
      });

      spectator.component.text$ = of('test');

      expect(setHasNotBeenCalled).toBeTrue();
    });
  });

  it('should set custom class on host element', () => {
    spectator.component.customClass = 'customClassTest';

    expect(spectator.element).toHaveClass('customClassTest');
  });

  it('should create passed template and send its context', async () => {
    const { component } = spectator;
    component.createTemplate('fakeTemplate' as any, { testError: 'test' }, of('test error'));

    expect(component.errorContext.$implicit).toEqual({ testError: 'test' });
    await expectAsync(component.errorContext.text$.toPromise()).toBeResolvedTo('test error');

    expect(component.errorTemplate).toBe('fakeTemplate' as any);
  });
});
