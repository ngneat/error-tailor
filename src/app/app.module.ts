import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorTailorModule } from '@ngneat/error-tailor';
import { CommonModule } from '@angular/common';
import { CustomErrorControlModule } from './custom-error-control/custom-error-control.module';
import { CustomControlErrorComponent } from './custom-error-control/custom-error-control.component';

/**
 * Hook function to attach error messages to the control's grandparent rather than its parent.
 * Uses direct manipulation of DOM.
 */
function controlErrorComponentAnchorFn(hostElem: Element, errorElem: Element) {
  hostElem.parentElement.parentElement.append(errorElem);
  return () => {
    hostElem.removeChild(errorElem);
  };
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    CommonModule,
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    CustomErrorControlModule,
    ErrorTailorModule.forRoot({
      errors: {
        useFactory() {
          return {
            required: 'This field is required',
            minlength: ({ requiredLength, actualLength }) => `Expect ${requiredLength} but got ${actualLength}`,
            invalidAddress: error => `Address not valid`
          };
        },
        deps: []
      },
      controlErrorComponent: CustomControlErrorComponent, // Uncomment to see errors being rendered using a custom component
      controlErrorComponentAnchorFn: controlErrorComponentAnchorFn // Uncomment to see errors being positioned differently
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {}
