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

  extraErrors = {
    minlength: ({ requiredLength }) => `Use country abbreviation! (min ${requiredLength} chars)`,
    maxlength: 'Use country abbreviation! (max 3 chars)'
  };

  constructor(private builder: FormBuilder) {}

  ngOnInit() {
    this.form = this.builder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      terms: [false, Validators.requiredTrue],
      animal: [null, Validators.required],
      address: this.builder.group(
        {
          city: ['', Validators.required],
          country: ['', [Validators.minLength(2), Validators.maxLength(3)]]
        },
        { validator: addressValidator }
      )
    });
  }
}

function addressValidator(addr: FormGroup) {
  return addr.value && addr.value.country && addr.value.city ? null : { invalidAddress: true };
}
