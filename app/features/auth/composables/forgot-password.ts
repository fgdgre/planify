import {
  validateField,
  validateForm,
  type ValidationSchema
} from "@features/validation";
import { AUTH_VALIDATION_MESSAGES } from "@shared/constants/auth-error-messages";
import { ROUTES } from "@shared/constants/routes";
import { useNotification } from "@features/notification";

export const useForgotPassword = () => {
  const supabase = useSupabaseClient()
  const runtimeConfig = useRuntimeConfig()
  const { showSuccessToast, showErrorToast } = useNotification()

  const loading = ref(false)
  const formData = ref({
    email: '',
  })

  const formErrorMessage = ref('')

  const touchedFields = ref({
    email: false,
  })

  const schema: ValidationSchema = {
    email: {
      required: { message: AUTH_VALIDATION_MESSAGES.email.required },
      email: { message: AUTH_VALIDATION_MESSAGES.email.invalid },
    },
  }

  const errorMessages = ref<Record<keyof typeof schema, string>>({
    email: '',
  })

  const _validateField = (value: string, key: 'email') => {
    const { error } = validateField(value, schema[key])
    errorMessages.value[key] = error ?? ''
  }

  const handleFieldChange = (value: string, key: 'email') => {
    if (touchedFields.value[key]) {
      _validateField(value, key)
    }
  }

  const handleFieldBlur = (key: 'email') => {
    if (!touchedFields.value[key]) {
      touchedFields.value[key] = true
      _validateField(formData.value[key], key)
    }
  }

  const changePassword = async () => {
    touchedFields.value.email = true
    formErrorMessage.value = ''

    const payload = { email: formData.value.email.trim() }
    const { error: validationError } = validateForm(payload, schema)
    if (validationError) {
      errorMessages.value = { ...errorMessages.value, ...validationError }
      return
    }

    try {
      loading.value = true

      const { error } = await supabase.auth.resetPasswordForEmail(payload.email, {
        redirectTo: runtimeConfig.public.BASE_URL + ROUTES.RESET_PASSWORD,
      })

      if (error) {
        showErrorToast({ title: 'Could not send reset email', description: error.message })
        return
      }

      showSuccessToast({
        title: 'Check your inbox',
        description: 'We sent a password reset link to your email.',
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
    touchedFields,
    errorMessages,
    changePassword,
    handleFieldChange,
    handleFieldBlur,
  }
}
