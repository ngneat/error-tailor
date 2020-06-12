<p align="center">
 <img width="20%" height="20%" src="./logo.svg">
</p>

<br />

> Making sure your tailor-made error solution is seamless!

[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)]()
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)
[![ngneat](https://img.shields.io/badge/@-ngneat-383636?style=flat-square&labelColor=8f68d4)](https://github.com/ngneat/)
[![spectator](https://img.shields.io/badge/tested%20with-spectator-2196F3.svg?style=flat-square)]()

The Error Tailor offers seamless handling of form errors, saving you the trouble of repeating the error boilerplate.
It's fully customizable, so you can control when, where, and how each form field's errors are displayed.
Sit back, relax, and let the Error Tailor do all the work!

<img src="./demo.gif">

## Getting Started

Run `ng add @ngneat/error-tailor`. This command updates the `AppModule`, and adds the `ErrorTailorModule` dependency:

<!-- prettier-ignore-start -->
```ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    ReactiveFormsModule,
    ErrorTailorModule.forRoot({
      errors: {
        useValue: {
          required: 'This field is required',
          minlength: ({ requiredLength, actualLength }) => 
                      `Expect ${requiredLength} but got ${actualLength}`,
          invalidAddress: error => `Address isn't valid`
        }
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```
<!-- prettier-ignore-end -->

The `errors` config property takes a partial `Provider`, that should provide a `HashMap< string | (err:any) => string >` that is an object with keys corresponding to the errors name that you want to handle, and values that can be a simple string, or function that return a string used as error message to be shown.
Now the only thing you need to add is the `errorTailor` directive to your form:

```html
<form [formGroup]="form" errorTailor>
  <div class="form-group">
    <input class="form-control" formControlName="name" placeholder="Name" />
  </div>

  <section formGroupName="address">
    <div class="form-group">
      <input class="form-control" formControlName="city" placeholder="City" />
    </div>

    <div class="form-group">
      <input class="form-control" formControlName="country" placeholder="Country" />
    </div>
  </section>

  <div class="form-group">
    <select formControlName="animal" class="form-control">
      <option *ngFor="let option of options; index as index" [ngValue]="option">
        {{ option.label }}
      </option>
    </select>
  </div>

  <button class="btn btn-success">Submit</button>
</form>
```

```ts
export class AppComponent {
  form: FormGroup;

  constructor(private builder: FormBuilder) {}

  ngOnInit() {
    this.form = this.builder.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      terms: [false, Validators.requiredTrue],
      animal: [null, Validators.required],
      address: this.builder.group(
        {
          city: ['', Validators.required],
          country: ['']
        },
        { validator: addressValidator }
      )
    });
  }
}
```

The directive will show all errors for a form field automatically in two instances - on the field element blur and on form submit.

## Inputs

- `controlErrorsClass` - A custom class that'll be added to the control error component, a component that is added after the form field when an error needs to be displayed:

```html
<input class="form-control" formControlName="city" placeholder="City" controlErrorsClass="my-class" />
```

- `controlErrorsTpl` - A custom error template to be used instead of the control error component's default view:

```html
<form errorTailor>
  <ng-template let-error let-text="text" #tpl> {{ error | json }} {{ text }} </ng-template>

  <div class="form-group">
    <input class="form-control" ngModel required name="name" [controlErrorsTpl]="tpl" />
  </div>

  <button class="btn btn-success">Submit</button>
</form>
```

- `controlErrorAnchor` - A custom `anchor` element for the control error component. The default anchor is the form field element:

```html
<div class="form-check form-group">
  <input type="checkbox" formControlName="terms" id="check" [controlErrorAnchor]="anchor" />
  <label class="form-check-label" for="check">
    I agree to the terms and conditions
  </label>
  <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>
</div>
```

The custom `anchor` can also be added as a directive, in which case it'll act as the anchor for any nested form fields:

```html
<div class="form-check form-group" controlErrorAnchor>
  <input type="checkbox" formControlName="terms" id="check" />
  <label class="form-check-label" for="check">
    I agree to the terms and conditions
  </label>
</div>
```

- `controlErrors` - Additional errors to use for the form field, that aren't specified in the config:

```html
<input class="form-control" formControlName="country" placeholder="Country" [controlErrors]="extraErrors" />
```

## CSS Styling

The library adds a `form-submitted` to the submitted form. You can use it to style your inputs:

```css
.form-submitted input.ng-invalid,
.form-submitted select.ng-invalid {
  border-color: #dc3545;
}
```

## Config

- `blurPredicate` - Elements that should listen the `focusout` event. The default predicate is:

```ts
{
  blurPredicate(element) {
    return element.tagName === 'INPUT' || element.tagName === 'SELECT';
  }
}
```

- `controlErrorsOnBlur` - To modify the error display behavior and show the errors on submission alone, set the following input:

```html
<input [controlErrorsOnBlur]="false" formControlName="name" />
```

## Recipies

### I18n Example

Here's how to support i18n:

```ts
import { TranslocoService } from '@ngneat/transloco';

@NgModule({
  declarations: [AppComponent],
  imports: [
    ErrorTailorModule.forRoot({
      errors: {
        useFactory(service: TranslocoService) {
          return {
            required: error => service.translate('errors.required')
          };
        },
        deps: [TranslocoService]
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

### Control Error Style

Here's a default style you can use for the error component:

```css
.control-error {
  width: 100%;
  margin-top: 0.25rem;
  font-size: 12px;
  color: #dc3545;
}
```

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://www.netbasal.com"><img src="https://avatars1.githubusercontent.com/u/6745730?v=4" width="100px;" alt=""/><br /><sub><b>Netanel Basal</b></sub></a><br /><a href="https://github.com/@ngneat/error-tailor/commits?author=NetanelBasal" title="Code">💻</a> <a href="https://github.com/@ngneat/error-tailor/commits?author=NetanelBasal" title="Documentation">📖</a> <a href="#ideas-NetanelBasal" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-NetanelBasal" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/tonivj5"><img src="https://avatars2.githubusercontent.com/u/7110786?v=4" width="100px;" alt=""/><br /><sub><b>Toni Villena</b></sub></a><br /><a href="https://github.com/@ngneat/error-tailor/commits?author=tonivj5" title="Code">💻</a> <a href="https://github.com/@ngneat/error-tailor/commits?author=tonivj5" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/theblushingcrow"><img src="https://avatars3.githubusercontent.com/u/638818?v=4" width="100px;" alt=""/><br /><sub><b>Inbal Sinai</b></sub></a><br /><a href="https://github.com/@ngneat/error-tailor/commits?author=theblushingcrow" title="Documentation">📖</a></td>
    <td align="center"><a href="https://twitter.com/dmorosinotto"><img src="https://avatars2.githubusercontent.com/u/3982050?v=4" width="100px;" alt=""/><br /><sub><b>Daniele Morosinotto</b></sub></a><br /><a href="https://github.com/@ngneat/error-tailor/commits?author=dmorosinotto" title="Code">💻</a> <a href="https://github.com/@ngneat/error-tailor/commits?author=dmorosinotto" title="Documentation">📖</a> <a href="#example-dmorosinotto" title="Examples">💡</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

Icon made by <a href="https://www.flaticon.com/authors/nhor-phai" title="Nhor Phai">Nhor Phai</a> from <a href="https://www.flaticon.com/" title="Flaticon"> www.flaticon.com</a>
