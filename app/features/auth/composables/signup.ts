import {
  validateField,
  validateForm,
  type ValidationSchema
} from "@features/validation";
import { useNotification } from "@features/notification";
import { AUTH_VALIDATION_MESSAGES } from "@shared/constants/auth-error-messages";
import { ROUTES } from "@shared/constants/routes";

export const useSignup = () => {
  const supabase = useSupabaseClient()
  const { showSuccessToast } = useNotification()

  const loading = ref(false)
  const formData = ref({
    email: '',
    password: '',
  })

  const formErrorMessage = ref('')

  const passwordInputType = ref<'password' | 'text'>('password')

  const touchedFields = ref({
    email: false,
    password: false,
  })

  const schema: ValidationSchema = {
    email: {
      required: { message: AUTH_VALIDATION_MESSAGES.email.required },
    },
    password: {
      required: { message: AUTH_VALIDATION_MESSAGES.password.required },
    },
  }

  const errorMessages = ref<Record<keyof typeof schema, string>>({
    email: '',
    password: '',
  })

  const touchAllFields = () => {
    touchedFields.value.email = true
    touchedFields.value.password = true
  }

  const _validateField = (value: string, key: 'email' | 'password') => {
    const { error } = validateField(value, schema[key])
    errorMessages.value[key] = error || ''
  }

  const handleFieldChange = (value: string, key: 'email' | 'password') => {
    if (touchedFields.value[key]) _validateField(value, key)
  }

  const handleFieldBlur = (key: 'password' | 'email') => {
    if (!touchedFields.value[key]) {
      touchedFields.value[key] = true
      _validateField(formData.value[key], key)
    }
  }

  const signup = async () => {
    touchAllFields()
    formErrorMessage.value = ''

    const signupData = {
      email: formData.value.email.trim(),
      password: formData.value.password.trim(),
    }

    const { error: validationError } = validateForm(signupData, schema)
    if (validationError) errorMessages.value = { ...validationError }

    if (errorMessages.value.email || errorMessages.value.password) return

    try {
      loading.value = true

      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/confirm`,
        },
      })

      if (error) {
        formErrorMessage.value = error.message
        return
      }

      if (!data.session) {
        showSuccessToast({ title: "Success", description: "Account created. Check your email to confirm, then come back to sign in." })
        navigateTo(ROUTES.CONFIRM)
        return
      }

    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    formData,
    formErrorMessage,
    passwordInputType,
    touchedFields,
    errorMessages,
    signup,
    handleFieldChange,
    handleFieldBlur,
  }
}
