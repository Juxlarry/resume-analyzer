import { AbstractControl, ValidatorFn } from '@angular/forms';

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const value = control.value || '';
    
    const errors: any = {};
    
    //Must be at least 8 characters
    if (value.length < 8) {
      errors.minLength = { requiredLength: 8, actualLength: value.length };
    }
    
    //Must contain at least one uppercase letter
    if (!/[A-Z]/.test(value)) {
      errors.uppercase = true;
    }
    
    //Must contain at least one number
    if (!/\d/.test(value)) {
      errors.number = true;
    }
    
    //Must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) {
      errors.specialChar = true;
    }
    
    return Object.keys(errors).length ? errors : null;
  };
}