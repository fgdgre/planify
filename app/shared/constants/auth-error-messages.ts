export const AUTH_VALIDATION_MESSAGES = {
  form: {
    invalidLoginData: "Incorrect email or password.",
  },
  email: {
    required: "Email is required.",
    invalid: "Email must be in a valid format.",
  },
  password: {
    required: "Password is required.",
    minLength: "Password must be at least 8 characters long.",
    hasLetter: "Password must contain at least one letter.",
    hasSpecialCharacter: "Password must contain a number or special character.",
    confirmRequired: "Please confirm your password.",
    mismatch: "Passwords do not match.",
  },
} as const;