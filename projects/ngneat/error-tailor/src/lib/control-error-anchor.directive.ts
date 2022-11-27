import { Directive, inject, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[controlErrorAnchor]',
  standalone: true,
  exportAs: 'controlErrorAnchor'
})
export class ControlErrorAnchorDirective {
  vcr = inject(ViewContainerRef);
}
