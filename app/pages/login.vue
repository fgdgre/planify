<script setup lang="ts">
import { useLogin } from "@features/auth";
import { ROUTES } from "~/shared/constants/routes";

definePageMeta({
  layout: 'default',
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
  <div class="grid grid-cols-2 h-full w-full">
    <div class="px-[75px] flex items-center justify-center">
      <div class="max-w-[350px] w-full">

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
            label="Email address"
            placeholder="you@example.com"
            :error-message="errorMessages.email"
            autocomplete="username"
            :disabled="loading"
            test-id="email-input"
            size="xl"
            leading-icon="material-symbols:mail-outline"
            @update:model-value="(v) => handleFieldChange(v, 'email')"
            @blur="handleFieldBlur('email')"
          />
          <SupaInput
            v-model="formData.password"
            label="Password"
            placeholder="Enter your password"
            :type="passwordInputType"
            :error-message="errorMessages.password"
            autocomplete="current-password"
            test-id="password-input"
            size="xl"
            leading-icon="mdi:password-outline"
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
            <template #label>
              <NuxtLink :to="ROUTES.FORGOT_PASSWORD" class="text-primary opacity-80 hover:opacity-100">
                Forgot password?
              </NuxtLink>
            </template>
          </SupaInput>
        </div>
        <div class="w-full flex flex-col gap-4">
          <SupaButton
            type="submit"
            stretch="width"
            :loading
            rounded="full"
          >
            Login
          </SupaButton>

          <div class="flex w-full justify-between text-sm">
            <div class="mx-auto">
              Don't have an account?

              <NuxtLink :to="ROUTES.SIGNUP" class="text-primary">
                Sign up for Planify
              </NuxtLink>
            </div>
          </div>
        </div>
      </form>
      </div>
    </div>

    <div class="bg-primary w-full"></div>
  </div>
</template>
