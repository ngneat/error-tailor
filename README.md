<p align="center">
 <img width="20%" height="20%" src="./logo.svg">
</p>

<br />

[![MIT](https://img.shields.io/packagist/l/doctrine/orm.svg?style=flat-square)]()
[![commitizen](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg?style=flat-square)]()
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)]()
[![styled with prettier](https://img.shields.io/badge/styled_with-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)
[![ngneat](https://img.shields.io/badge/@-ngneat-383636?style=flat-square&labelColor=8f68d4)](https://github.com/ngneat/)
[![spectator](https://img.shields.io/badge/tested%20with-spectator-2196F3.svg?style=flat-square)]()

> Making sure your tailor-made error solution is seamless!

## Getting Started

Run `ng add @ngneat/error-tailor`. This command updates the `AppModule`, and adds the `ErrorTailorModule`:

```ts
@NgModule({
  declarations: [AppComponent],
  imports: [
    ReactiveFormsModule,
    ErrorTailorModule.forRoot({
      errors: {
        useValue() {
          required: error => `This field is required`,
          minlength: ({ requiredLength, actualLength }) => `Expect ${requiredLength} but got ${actualLength}`,
          invalidAddress: error => `Address not valid`
        },
      }
    })
  ],
  bootstrap: [AppComponent]
})
export class AppModule {}
```

The `errors` config property takes a partial `Provider` that should provide an object with the form errors. 
Now, the only thing that you need to add the `errorTailor` directive to your form:

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

The directive will show each error automagically in two cases - on submit or on blur.

## Inputs
- `controlErrorsClass` - Custom class that'll be added to the control error component:
```html
<input class="form-control" formControlName="city" placeholder="City" controlErrorsClass="my-class"/>
```

- `controlErrorsTpl` - Custom error template:
```html
<form errorTailor>
  <ng-template let-error let-text="text" #tpl> {{ error | json }} {{ text }} </ng-template>

  <div class="form-group">
    <input class="form-control" ngModel="name" required name="name" [controlErrorsTpl]="tpl" />
  </div>

  <button class="btn btn-success">Submit</button>
</form>
```

- `controlErrorAnchor` - Provide an `anchor` element for the error component:
```html
<div class="form-check form-group">
  <input type="checkbox" formControlName="terms" id="check" [controlErrorAnchor]="anchor" />
  <label class="form-check-label" for="check">
    I agree to the terms and conditions
  </label>
  <ng-template controlErrorAnchor #anchor="controlErrorAnchor"></ng-template>
</div>
```

Or:

```html
<div class="form-check form-group" controlErrorAnchor>
  <input type="checkbox" formControlName="terms" id="check" />
  <label class="form-check-label" for="check">
    I agree to the terms and conditions
  </label>
</div>
```

- `customErrors` - Local errors to use:
```html
<input class="form-control" formControlName="city" placeholder="City" [customErrors]="serverErrors"/>
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
    return element.tagName === 'INPUT';
  }
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
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
