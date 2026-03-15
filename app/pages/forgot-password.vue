<script setup lang="ts">
import { useForgotPassword } from "@features/auth";

definePageMeta({
  layout: 'login',
  layoutTitle: 'Enter email to get reset link',
})

const {
  loading,
  formData,
  formErrorMessage,
  errorMessages,
  changePassword,
  handleFieldChange,
  handleFieldBlur,
} = useForgotPassword()
</script>

<template>
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
    Send
  </SupaButton>

</form>
</template>
