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
  },
} as const;