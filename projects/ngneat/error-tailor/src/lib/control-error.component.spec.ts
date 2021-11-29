import { Spectator, createComponentFactory, byText } from '@ngneat/spectator';

import { DefaultControlErrorComponent } from './control-error.component';

describe('ControlErrorComponent', () => {
  let spectator: Spectator<DefaultControlErrorComponent>;
  const createComponent = createComponentFactory(DefaultControlErrorComponent);

  beforeEach(() => (spectator = createComponent()));

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('when text is setted', () => {
    it('should show text error when it is setted', () => {
      spectator.component.text = 'test';

      spectator.detectChanges();

      expect(spectator.component.errorText).toBe('test');
      expect(spectator.component.hideError).toBeFalse();
      expect(spectator.query(byText('test'))).toBeTruthy();
    });

    it('should hide text when error is empty', () => {
      spectator.component.text = 'test';

      spectator.detectChanges();

      spectator.component.text = '';

      spectator.detectChanges();

      expect(spectator.component.errorText).toBe('');
      expect(spectator.component.hideError).toBeTrue();
      expect(spectator.query(byText('test'))).toBeNull();
    });

    it('should do nothing when text has not changed', () => {
      spectator.component.text = 'test';

      let setHasNotBeenCalled = true;

      Object.defineProperty(spectator.component, '_text', {
        get() {
          return 'test';
        },
        set() {
          setHasNotBeenCalled = false;
        }
      });

      spectator.component.text = 'test';

      expect(setHasNotBeenCalled).toBeTrue();
    });
  });

  it('should set custom class on host element', () => {
    spectator.component.customClass = 'customClassTest';

    expect(spectator.element).toHaveClass('customClassTest');
  });

  it('should set multiply css classes on host element', () => {
    spectator.component.customClass = 'customClassTest1 customClassTest2';

    expect(spectator.element).toHaveClass(['customClassTest1', 'customClassTest2']);
  });

  it('should set multiply css classes as array on host element', () => {
    spectator.component.customClass = ['customClassTest1', 'customClassTest2'];

    expect(spectator.element).toHaveClass(['customClassTest1', 'customClassTest2']);
  });

  it('should create passed template and send its context', () => {
    const { component } = spectator;
    component.createTemplate('fakeTemplate' as any, { testError: 'test' }, 'test error');

    expect(component.errorContext).toEqual({
      $implicit: { testError: 'test' },
      text: 'test error'
    });

    expect(component.errorTemplate).toBe('fakeTemplate' as any);
  });
});
