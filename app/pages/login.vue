<script setup lang="ts">
import { AUTH_VALIDATION_MESSAGES } from "~/shared/constants/auth-error-messages";
import { ROUTES } from "~/shared/constants/routes";
import { validateField, validateForm, type ValidationSchema } from "~/shared/validation";
import { useUserStore } from "~/auth/stores/user";

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
      userStore.setProfile(data.user)
      navigateTo((useRoute().query.redirectTo as string) || ROUTES.HOME)
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-80 w-[calc(100%-64px)] mx-auto gap-5">
    <h1 class="text-2xl font-bold mb-4">Login</h1>
    <SupaInlineAlert
      v-if="formErrorMessage"
      color="error"
      icon="heroicons:exclamation-triangle"
      :message="formErrorMessage"
    />
    <form
      @submit.prevent="login"
      class="flex flex-col gap-10 items-center justify-center w-full"
    >
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
          autocomplete="current-password"
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
        <SupaButton
          type="submit"
          stretch="width"
          :loading
        >
          Login
        </SupaButton>

        <div class="flex w-full justify-between text-sm">
          <NuxtLink :to="ROUTES.FORGOT_PASSWORD" class="underline opacity-80 hover:opacity-100">
            Forgot password?
          </NuxtLink>

          <NuxtLink :to="ROUTES.SIGNUP" class="underline">
            Sign up
          </NuxtLink>
        </div>
      </div>
    </form>
  </div>
</template>