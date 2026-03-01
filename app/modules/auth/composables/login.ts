import {
  validateField,
  validateForm,
  type ValidationSchema
} from "@modules/validation";
import { useUserStore } from "../stores/user";
import { AUTH_VALIDATION_MESSAGES } from "@constants/auth-error-messages";
import { ROUTES } from "@constants/routes";

export const useLogin = () => {
  const supabase = useSupabaseClient()

  const userStore = useUserStore()

  const loading = ref(false)
  const formData = ref({
    email: '',
    password: '',
  })

  const formErrorMessage = ref('')

  const passwordInputType = ref<'password' | 'text'>('password')

// Validation
  const touchedFields = ref({
    email: false,
    password: false,
  })

  const errorMessages = ref<Record<keyof typeof schema, string>>({
    email: '',
    password: '',
  })

  const schema: ValidationSchema = {
    email: {
      required: { message: AUTH_VALIDATION_MESSAGES.email.required },
    },
    password: { required: { message: AUTH_VALIDATION_MESSAGES.password.required } },
  }

  const touchAllFields = () => {
    touchedFields.value.email = true
    touchedFields.value.password = true
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

  const login = async () => {
    touchAllFields()
    formErrorMessage.value = ''

    const loginData = {
      email: formData.value.email.trim(),
      password: formData.value.password.trim(),
    }

    const { error: validationError } = validateForm(loginData, schema)
    if (validationError) {
      errorMessages.value = { ...validationError }
    }

    if (errorMessages.value.email || errorMessages.value.password) {
      return
    }

    try {
      loading.value = true

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      })

      console.log(data)

      if (error) {
        console.error(error)
        if (error.message === 'Invalid login credentials') {
          formErrorMessage.value = AUTH_VALIDATION_MESSAGES.form.invalidLoginData
        } else {
          formErrorMessage.value = error.message
        }
      } else {
        userStore.setUser(data.user)
        navigateTo((useRoute().query.redirectTo as string) || ROUTES.HOME)
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
    login,
    handleFieldChange,
    handleFieldBlur,
  }
}