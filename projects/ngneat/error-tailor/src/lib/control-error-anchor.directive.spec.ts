import { Component, Input } from '@angular/core';
import { SpectatorDirective, createDirectiveFactory } from '@ngneat/spectator';

import { ControlErrorAnchorDirective } from './control-error-anchor.directive';

@Component({
  selector: 'get-anchor',
  template: ''
})
class GetAnchorComponent {
  @Input()
  anchor: ControlErrorAnchorDirective;
}

describe('ControlErrorAnchorDirective', () => {
  let spectator: SpectatorDirective<ControlErrorAnchorDirective>;
  const createDirective = createDirectiveFactory({
    directive: ControlErrorAnchorDirective,
    declarations: [GetAnchorComponent]
  });

  beforeEach(() => {
    spectator = createDirective(`
      <div controlErrorAnchor #anchor="controlErrorAnchor"></div>
      <get-anchor [anchor]="anchor"></get-anchor>
    `);
  });

  it('should create', () => {
    expect(spectator.directive).toBeTruthy();
  });

  it('should contain ViewContainerRef instance', () => {
    expect(spectator.directive.vcr).toBeTruthy();
  });

  it('should be exported as `controlErrorAnchor`', () => {
    spectator.detectChanges();
    expect(spectator.query(GetAnchorComponent).anchor).toBe(spectator.directive);
  });
});
