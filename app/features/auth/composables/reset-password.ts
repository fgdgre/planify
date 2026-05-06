import {
  validateField,
  validateForm,
  validateMatchWith,
  type ValidationSchema,
} from "@features/validation";
import { useNotification } from "@features/notification";
import { AUTH_VALIDATION_MESSAGES } from "@shared/constants/auth-error-messages";
import { ROUTES } from "@shared/constants/routes";

type FieldKey = 'password' | 'confirmPassword'

export const useResetPassword = () => {
  const supabase = useSupabaseClient()
  const { showSuccessToast, showErrorToast } = useNotification()

  const loading = ref(false)
  const formData = ref({
    password: '',
    confirmPassword: '',
  })

  const formErrorMessage = ref('')
  const passwordInputType = ref<'password' | 'text'>('password')
  const confirmPasswordInputType = ref<'password' | 'text'>('password')

  const touchedFields = ref<Record<FieldKey, boolean>>({
    password: false,
    confirmPassword: false,
  })

  const errorMessages = ref<Record<FieldKey, string>>({
    password: '',
    confirmPassword: '',
  })

  const schema: ValidationSchema = {
    password: {
      required: { message: AUTH_VALIDATION_MESSAGES.password.required },
      length: { min: { value: 8, message: AUTH_VALIDATION_MESSAGES.password.minLength } },
      hasLetter: { message: AUTH_VALIDATION_MESSAGES.password.hasLetter },
      hasSpecialCharacter: { message: AUTH_VALIDATION_MESSAGES.password.hasSpecialCharacter },
    },
    confirmPassword: {
      required: { message: AUTH_VALIDATION_MESSAGES.password.confirmRequired },
    },
  }

  const validatePasswordMatch = () => {
    if (!formData.value.confirmPassword) return ''
    const matches = validateMatchWith({
      value: formData.value.password,
      matchWith: formData.value.confirmPassword,
    })
    return matches ? '' : AUTH_VALIDATION_MESSAGES.password.mismatch
  }

  const _validateField = (value: string, key: FieldKey) => {
    const { error } = validateField(value, schema[key])

    if (error) {
      errorMessages.value[key] = error
      return
    }

    if (key === 'confirmPassword' || key === 'password') {
      const matchError = validatePasswordMatch()
      errorMessages.value.confirmPassword = matchError
    }

    if (key !== 'confirmPassword') {
      errorMessages.value[key] = ''
    }
  }

  const handleFieldChange = (value: string, key: FieldKey) => {
    if (touchedFields.value[key]) {
      _validateField(value, key)
    }
  }

  const handleFieldBlur = (key: FieldKey) => {
    if (!touchedFields.value[key]) {
      touchedFields.value[key] = true
      _validateField(formData.value[key], key)
    }
  }

  const resetPassword = async () => {
    touchedFields.value.password = true
    touchedFields.value.confirmPassword = true
    formErrorMessage.value = ''

    const payload = {
      password: formData.value.password,
      confirmPassword: formData.value.confirmPassword,
    }

    const { error: validationError } = validateForm(payload, schema)
    errorMessages.value = {
      password: validationError?.password ?? '',
      confirmPassword: validationError?.confirmPassword ?? '',
    }

    if (!errorMessages.value.confirmPassword) {
      errorMessages.value.confirmPassword = validatePasswordMatch()
    }

    if (errorMessages.value.password || errorMessages.value.confirmPassword) return

    try {
      loading.value = true

      const { error } = await supabase.auth.updateUser({ password: payload.password })

      if (error) {
        formErrorMessage.value = error.message
        showErrorToast({ title: 'Could not update password', description: error.message })
        return
      }

      await supabase.auth.signOut()

      showSuccessToast({
        title: 'Password updated',
        description: 'Sign in with your new password.',
      })

      await navigateTo(ROUTES.LOGIN)
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    formData,
    formErrorMessage,
    passwordInputType,
    confirmPasswordInputType,
    touchedFields,
    errorMessages,
    resetPassword,
    handleFieldChange,
    handleFieldBlur,
  }
}
