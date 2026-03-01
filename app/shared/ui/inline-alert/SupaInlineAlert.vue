<script setup lang="ts">
import * as inlineAlertVariants from './inline-alert'

defineProps<{
  icon?: string
  message?: string
  items?: string[]
  color?: 'primary' | 'error' | 'theme' | 'info'
  ui?: { wrapper?: string; icon?: string; message?: string; list?: string; listItem?: string }
}>()
</script>

<template>
  <div
    :class="inlineAlertVariants.wrapper({ color, withIcon: Boolean(icon), class: ui?.wrapper })"
    data-testid="inline-alert"
  >
    <SupaIcon v-if="icon" :name="icon" :ui="{ icon: `text-inherit shrink-0 row-start-1 ${ui?.icon}` }" size="sm" />
    <p v-if="message" :class="inlineAlertVariants.message({ withIcon: Boolean(icon), class: ui?.message })">
      {{ message }}
    </p>
    <ul v-if="items?.length" :class="inlineAlertVariants.list({ withIcon: Boolean(icon), class: ui?.list })">
      <li v-for="item in items" :class="inlineAlertVariants.listItem({ class: ui?.listItem })">{{ item }}</li>
    </ul>
  </div>
</template>

<style scoped>
.alert-grid-layout {
  display: grid;
  grid-template-columns: auto 1fr;
}
</style>
