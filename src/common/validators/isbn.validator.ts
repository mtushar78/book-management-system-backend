import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ async: false })
export class IsISBNConstraint implements ValidatorConstraintInterface {
  validate(isbn: string): boolean {
    if (!isbn) return false;


    const cleanISBN = isbn.replace(/[-\s]/g, '');

    if (cleanISBN.length === 10) {
      return this.validateISBN10(cleanISBN);
    } else if (cleanISBN.length === 13) {
      return this.validateISBN13(cleanISBN);
    }

    return false;
  }

  validateISBN10(isbn: string): boolean {
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      const digit = parseInt(isbn[i]);
      if (isNaN(digit)) return false;
      sum += digit * (10 - i);
    }

    const lastChar = isbn[9].toUpperCase();
    const checkDigit = lastChar === 'X' ? 10 : parseInt(lastChar);
    if (isNaN(checkDigit) && lastChar !== 'X') return false;

    sum += checkDigit;
    return sum % 11 === 0;
  }

  validateISBN13(isbn: string): boolean {
    if (!/^\d{13}$/.test(isbn)) return false;

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const digit = parseInt(isbn[i]);
      sum += digit * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = parseInt(isbn[12]);
    const calculatedCheck = (10 - (sum % 10)) % 10;
        // console.log("checkDigit:",checkDigit)

    return checkDigit === calculatedCheck;
  }

  defaultMessage(): string {
    return 'isbn must be a valid ISBN-10 or ISBN-13';
  }
}

export function IsISBNCustom(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsISBNConstraint,
    });
  };
}