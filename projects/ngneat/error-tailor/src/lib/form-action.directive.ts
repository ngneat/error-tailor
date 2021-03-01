import { Directive, ElementRef } from '@angular/core';
import { fromEvent, Observable } from 'rxjs';
import { shareReplay, tap } from 'rxjs/operators';

@Directive({
  selector: 'form[errorTailor]'
})
export class FormActionDirective {
  submit$: Observable<Event> = fromEvent(this.element, 'submit').pipe(
    tap(() => {
      if (this.element.classList.contains('form-submitted') === false) {
        this.element.classList.add('form-submitted');
      }
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  reset$: Observable<Event> = fromEvent(this.element, 'reset').pipe(
    tap(() => {
      this.element.classList.remove('form-submitted');
    }),
    shareReplay({ refCount: true, bufferSize: 1 })
  );

  constructor(private host: ElementRef<HTMLFormElement>) {}

  get element() {
    return this.host.nativeElement;
  }
}
