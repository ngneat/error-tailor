import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  form: FormGroup;
  model = 'Hey';

  options = Array.from(Array(5), (_, i) => ({
    label: `Animal ${i + 1}`,
    id: i + 1
  }));

  constructor(private builder: FormBuilder) {}

  ngOnInit() {
    this.form = this.builder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      terms: [false, Validators.requiredTrue],
      animal: [null, Validators.required],
      address: this.builder.group(
        {
          city: ['', Validators.required],
          country: ['', Validators.required]
        },
        { validator: addressValidator }
      )
    });
  }
}

function addressValidator(formGroup: FormGroup) {
  return { invalidAddress: true };
}
