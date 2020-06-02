import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ErrorTailorModule, FORM_ERRORS } from '@ngneat/error-tailor';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, AppRoutingModule, FormsModule, ReactiveFormsModule, ErrorTailorModule],
  providers: [
    {
      provide: FORM_ERRORS,
      useValue: {
        required: error => `This field is required`,
        minlength: ({ requiredLength, actualLength }) => `Expect ${requiredLength} but got ${actualLength}`,
        invalidAddress: error => `Address not valid`
      }
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
