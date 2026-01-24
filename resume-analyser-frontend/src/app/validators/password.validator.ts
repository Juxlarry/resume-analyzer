import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value || '';
    
    const errors: any = {};
    
    if (value.length < 8) {
      errors.minLength = { requiredLength: 8, actualLength: value.length };
    }
    
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    
    if (!/\d/.test(value)) {
      errors.number = true;
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors.specialChar = true;
    }
    
    return Object.keys(errors).length ? errors : null;
  };
}