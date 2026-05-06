<script setup lang="ts">
import { useResetPassword } from "@features/auth";
import { ROUTES } from "~/shared/constants/routes";

definePageMeta({
  layout: 'default',
})

const {
  loading,
  formData,
  formErrorMessage,
  passwordInputType,
  confirmPasswordInputType,
  errorMessages,
  resetPassword,
  handleFieldChange,
  handleFieldBlur,
} = useResetPassword()
</script>

<template>
  <div class="grid grid-cols-2 h-full w-full">
    <div class="px-[75px] flex items-center justify-center">
      <div class="max-w-[350px] w-full">
        <div class="flex gap-2 items-center">
          <svg class="w-10 h-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
            <rect width="32" height="32" rx="6" fill="#9688CF"/>
            <path d="M10 3V8" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M21 3V8" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M23.6667 6H7.33333C6.04467 6 5 7.09441 5 8.44444V25.5556C5 26.9056 6.04467 28 7.33333 28H23.6667C24.9553 28 26 26.9056 26 25.5556V8.44444C26 7.09441 24.9553 6 23.6667 6Z" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M6 11H16H26" stroke="white" stroke-width="1.66667" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>

          <p class="text-[18px] font-medium">Planify</p>
        </div>

        <div class="mt-10">
          <h1 class="text-4xl font-medium">Set a new password</h1>

          <p class="text-placeholder">Pick something secure and easy to remember.</p>
        </div>

        <div class="mt-9">
          <SupaInlineAlert
            v-if="formErrorMessage"
            color="error"
            icon="heroicons:exclamation-triangle"
            :message="formErrorMessage"
          />

          <form
            class="flex flex-col gap-10 items-center justify-center w-full"
            @submit.prevent="resetPassword"
          >
            <div class="flex flex-col gap-4 w-full">
              <SupaInput
                v-model="formData.password"
                label="New password"
                placeholder="Create a password"
                :type="passwordInputType"
                :error-message="errorMessages.password"
                autocomplete="new-password"
                :disabled="loading"
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
              </SupaInput>

              <SupaInput
                v-model="formData.confirmPassword"
                label="Confirm password"
                placeholder="Repeat the password"
                :type="confirmPasswordInputType"
                :error-message="errorMessages.confirmPassword"
                autocomplete="new-password"
                :disabled="loading"
                test-id="confirm-password-input"
                size="xl"
                leading-icon="mdi:password-outline"
                @update:model-value="(v) => handleFieldChange(v, 'confirmPassword')"
                @blur="handleFieldBlur('confirmPassword')"
              >
                <template #trailing>
                  <SupaButton
                    variant="transparent"
                    :icon="confirmPasswordInputType === 'password' ? 'heroicons:eye' : 'heroicons:eye-slash'"
                    @click="confirmPasswordInputType = confirmPasswordInputType === 'password' ? 'text' : 'password'"
                  />
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
                Update password
              </SupaButton>

              <div class="flex w-full justify-between text-sm">
                <div class="mx-auto">
                  Remembered it?

                  <NuxtLink :to="ROUTES.LOGIN" class="text-primary">
                    Back to login
                  </NuxtLink>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>

    <div class="bg-primary w-full flex flex-col items-center justify-center p-12">
      <div class="flex flex-col gap-6 text-white">
        <h2 class="text-5xl font-medium">Almost there</h2>
        <p>Your account stays safe — only you can complete this step.</p>
      </div>
    </div>
  </div>
</template>
