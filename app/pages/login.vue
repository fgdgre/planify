<script setup lang="ts">
import { useLogin } from "@modules/auth";
import { ROUTES } from "~/shared/constants/routes";


definePageMeta({
  layout: 'login',
  layoutTitle: 'Login',
})

const {
  loading,
  formData,
  formErrorMessage,
  passwordInputType,
  errorMessages,
  login,
  handleFieldChange,
  handleFieldBlur,
} = useLogin()
</script>

<template>
  <SupaInlineAlert
    v-if="formErrorMessage"
    color="error"
    icon="heroicons:exclamation-triangle"
    :message="formErrorMessage"
  />
  <form
    class="flex flex-col gap-10 items-center justify-center w-full"
    @submit.prevent="login"
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
</template>