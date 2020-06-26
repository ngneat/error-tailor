import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomControlErrorComponent } from './custom-error-control.component';

@NgModule({
  declarations: [CustomControlErrorComponent],
  imports: [CommonModule],
  exports: [CustomControlErrorComponent]
})
export class CustomErrorControlModule {}
