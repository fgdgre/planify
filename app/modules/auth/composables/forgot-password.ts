import {
  validateField,
  type ValidationSchema
} from "@modules/validation";
import { AUTH_VALIDATION_MESSAGES } from "@constants/auth-error-messages";
import { ROUTES } from "@constants/routes";

export const useForgotPassword = () => {
  const supabase = useSupabaseClient()
  const runtimeConfig = useRuntimeConfig()

  const loading = ref(false)
  const formData = ref({
    email: '',
    password: '',
  })

  const formErrorMessage = ref('')

// Validation
  const touchedFields = ref({
    email: false,
    password: false,
  })

  const errorMessages = ref<Record<keyof typeof schema, string>>({
    email: '',
  })

  const schema: ValidationSchema = {
    email: {
      required: { message: AUTH_VALIDATION_MESSAGES.email.required },
    },
    password: { required: { message: AUTH_VALIDATION_MESSAGES.password.required } },
  }

  const _validateField = (value: string, key: 'email' | 'password') => {
    const { error } = validateField(value, schema[key])

    if (error) {
      errorMessages.value[key] = error
    } else {
      errorMessages.value[key] = ''
    }
  }

  const handleFieldChange = (value: string, key: 'email' | 'password') => {
    if (touchedFields.value[key]) {
      _validateField(value, key)
    }
  }

  const handleFieldBlur = (key: 'password' | 'email') => {
    if (!touchedFields.value[key]) {
      touchedFields.value[key] = true
      _validateField(formData.value[key], key)
    }
  }
  const changePassword = async () => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(formData.value.email, {
      redirectTo: runtimeConfig.public.BASE_URL + ROUTES.RESET_PASSWORD,
    })
    console.log(data, error)
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