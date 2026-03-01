<script setup lang="ts">

import { validateField, type ValidationSchema } from "~/shared/validation";
import { AUTH_VALIDATION_MESSAGES } from "~/shared/constants/auth-error-messages";

const supabase = useSupabaseClient()

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
const changePassword = async () => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(formData.value.email, {
    redirectTo: 'https://example.com/update-password',
  })
  console.log(data, error)
}
</script>

<template>
  <div class="flex flex-col h-full justify-center items-center max-w-80 w-[calc(100%-64px)] mx-auto gap-5">
    <h1 class="text-2xl font-bold mb-4">Send email to change password</h1>
    <SupaInlineAlert
      v-if="formErrorMessage"
      color="error"
      icon="heroicons:exclamation-triangle"
      :message="formErrorMessage"
    />
    <form
      @submit.prevent="changePassword"
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
      </div>

      <SupaButton
        type="submit"
        stretch="width"
        :loading
      >
        Login
      </SupaButton>

    </form>
  </div>
</template>

<style scoped>

</style>