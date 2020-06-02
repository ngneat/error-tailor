import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[controlErrorAnchor]',
  exportAs: 'controlErrorAnchor'
})
export class ControlErrorAnchorDirective {
  constructor(public vcr: ViewContainerRef) {}
}
