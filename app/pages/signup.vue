<script setup lang="ts">
import { useSignup } from "@modules/auth";

definePageMeta({
  layout: 'login',
  layoutTitle: 'Sign up',
})

const {
  loading,
  formData,
  formErrorMessage,
  passwordInputType,
  errorMessages,
  signup,
  handleFieldChange,
  handleFieldBlur,
} = useSignup()
</script>

<template>
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
</template>