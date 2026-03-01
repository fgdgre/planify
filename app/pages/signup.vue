<script setup lang="ts">
import { AUTH_VALIDATION_MESSAGES } from "~/shared/constants/auth-error-messages";
import { ROUTES } from "~/shared/constants/routes";
import { validateField, validateForm, type ValidationSchema } from "~/shared/validation";
import { useNotification } from "~/notification";

definePageMeta({ name: 'signup' })

const client = useSupabaseClient()
const loading = ref(false)

const formData = ref({
  email: '',
  password: '',
})

const formErrorMessage = ref('')
const formSuccessMessage = ref('')

const passwordInputType = ref<'password' | 'text'>('password')

// Validation (same pattern as login)
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
  formSuccessMessage.value = ''

  const signupData = {
    email: formData.value.email.trim(),
    password: formData.value.password.trim(),
  }

  const { error: validationError } = validateForm(signupData, schema)
  if (validationError) errorMessages.value = { ...validationError }

  if (errorMessages.value.email || errorMessages.value.password) return

  try {
    loading.value = true

    const { data, error } = await client.auth.signUp({
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
      useNotification().showSuccessToast({ title: "Success", description: "Account created. Check your email to confirm, then come back to sign in." })
      return
    }

    navigateTo(ROUTES.CONFIRM)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-80 w-[calc(100%-64px)] mx-auto gap-5">
    <h1 class="text-2xl font-bold mb-4">Sign up</h1>

    <SupaInlineAlert
      v-if="formErrorMessage"
      color="error"
      icon="heroicons:exclamation-triangle"
      :message="formErrorMessage"
    />

    <form @submit.prevent="signup" class="flex flex-col gap-10 items-center justify-center w-full">
      <div class="flex flex-col gap-4 w-full">
        <SupaInput
          v-model="formData.email"
          label="Email"
          :error-message="errorMessages.email"
          autocomplete="username"
          :disabled="loading"
          test-id="email-input"
          @update:model-value="(v) => handleFieldChange(v, 'email')"
          @blur="handleFieldBlur('email')"
        />

        <SupaInput
          v-model="formData.password"
          label="Password"
          :type="passwordInputType"
          :error-message="errorMessages.password"
          autocomplete="new-password"
          :disabled="loading"
          test-id="password-input"
          @update:model-value="(v) => handleFieldChange(v, 'password')"
          @blur="handleFieldBlur('password')"
        >
          <template #trailing>
            <SupaButton
              variant="transparent"
              :icon="passwordInputType === 'password' ? 'heroicons:eye' : 'heroicons:eye-slash'"
              @click="passwordInputType = passwordInputType === 'password' ? 'text' : 'password'"
            />
          </template>
        </SupaInput>
      </div>

      <div class="w-full flex flex-col gap-4">
        <SupaButton type="submit" stretch="width" :loading>
          Create account
        </SupaButton>

        <div class="flex flex-col gap-3 w-full justify-between text-sm">
          Already have an account?
          <NuxtLink to="/login" class="underline">Login</NuxtLink>
        </div>
      </div>
    </form>
  </div>
</template>