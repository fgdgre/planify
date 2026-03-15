<script lang="ts" setup>
import { useScroll } from '@vueuse/core'
import * as dropdownVariants from './dropdown'

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from 'reka-ui'

const props = withDefaults(
  defineProps<{
    label?: string
    items?: { label: string; value: string; icon?: string }[]
    size?: 'sm' | 'md' | 'lg' | 'xl'
    menuAlign?: 'start' | 'center' | 'end'
    placeholder?: string
    color?: 'primary' | 'error'
    loading?: boolean
    loadingMessage?: string
    disabled?: boolean
    isError?: boolean
    errorMessage?: string
    forceMount?: boolean
    noShadow?: boolean
    stickyPlaceholder?: boolean
    clearable?: boolean
    menuStretch?: boolean
    emptyMessage?: string
    isEmpty?: boolean
    testId?: string
    ui?: {
      wrapper?: string
      trigger?: string
      placeholder?: string
      selectedItem?: string
      selectedItemIcon?: string
      icon?: string
      menuContent?: string
      menuItem?: string
      empty?: string
      loading?: string
      itemsList?: string
    }
  }>(),
  {
    menuAlign: 'end',
  }
)

defineEmits<{
  'update:modelValue': [string]
  blur: [Event]
}>()

const selected = defineModel<string>()

const clearSelectedItem = () => {
  isDropdownOpen.value = false
  selected.value = ''
}

const currentItem = computed(() => props.items?.find((i) => i.value === selected.value))

const isDropdownOpen = ref(false)

const selectItem = (item: { label: string; value: string; icon?: string }) => {
  isDropdownOpen.value = false
  selected.value = item.value
}

const { isScrolling } = useScroll(window)

watchEffect(() => {
  if (isScrolling.value && isDropdownOpen.value) {
    isDropdownOpen.value = false
  }
})
</script>

<template>
  <DropdownMenuRoot v-model:open="isDropdownOpen" :modal="false">
    <div :class="[dropdownVariants.wrapper({ class: ui?.wrapper })]">
      <p v-if="label" :class="[dropdownVariants.label({ error: isError || Boolean(errorMessage) })]">
        {{ label }}
      </p>

      <DropdownMenuTrigger
        :class="
          dropdownVariants.menuTrigger({
            color,
            error: isError || Boolean(errorMessage),
            disabled,
            noShadow,
            stickyPlaceholder,
            class: [ui?.trigger, selected && stickyPlaceholder && 'min-w-[180px]'],
          })
        "
        :aria-invalid="Boolean(errorMessage) || isError"
        :aria-describedby="errorMessage"
        :disabled
        :data-testid="testId || 'dropdown-menu-trigger'"
        @click="isDropdownOpen = !isDropdownOpen"
      >
        <slot name="menuTrigger">
          <div
            v-if="(placeholder && !selected) || stickyPlaceholder"
            data-testid="supa-dropdown-placeholder"
            :class="[
              dropdownVariants.menuTriggerPlaceholder({
                color,
                error: isError || Boolean(errorMessage),
                class: ui?.placeholder,
              }),
            ]"
          >
            <p>{{ placeholder }}</p>
            <div v-if="selected" class="w-[1px] bg-border"></div>
          </div>
          <div
            v-if="selected"
            :class="[
              dropdownVariants.menuTriggerSelectedItem({
                color,
                error: isError || Boolean(errorMessage),
                class: [ui?.selectedItem, 'flex-1'],
              }),
            ]"
            data-testid="supa-dropdown-selected-item"
          >
            <!-- <template v-if="selected"> -->
            <SupaIcon
              v-if="currentItem?.icon"
              :name="currentItem.icon"
              size="xs"
              :ui="{ icon: ui?.selectedItemIcon }"
            />
            <p class="truncate">
              {{ currentItem?.label }}
            </p>
            <!-- </template> -->

            <SupaButton
              v-if="clearable"
              icon="heroicons:x-mark"
              @click.stop="clearSelectedItem"
              variant="transparent"
              :ui="{ button: 'w-min h-min p-[2px] ml-auto', icon: 'size-[14px] text-placeholder ' }"
            />
          </div>

          <SupaIcon
            name="heroicons:chevron-down"
            :ui="{
              icon: dropdownVariants.menuTriggerIcon({
                color,
                error: isError || Boolean(errorMessage),
                open: isDropdownOpen,
                class: ui?.icon,
              }),
            }"
          />
        </slot>
      </DropdownMenuTrigger>

      <p v-if="errorMessage" :class="[dropdownVariants.errorMessage()]">
        {{ errorMessage }}
      </p>

      <DropdownMenuPortal>
        <DropdownMenuContent
          @interact-outside="(e) => $emit('blur', e)"
          :force-mount="forceMount"
          :side-offset="5"
          :align="menuAlign"
          :class="[
            dropdownVariants.menuContent({
              color,
              disabled,
              menuStretch,
              class: [ui?.menuContent, (isEmpty || loading) && 'p-0'],
            }),
          ]"
          data-testid="dropdown-menu-content"
        >
          <div v-if="!(isEmpty || loading)" :class="[dropdownVariants.itemsList({ class: ui?.itemsList })]">
            <DropdownMenuItem
              v-for="(item, i) in items"
              :key="item.label"
              :data-testid="'dropdown-menu-item' + '-' + i"
              :class="[dropdownVariants.menuContentItem({ color, disabled, class: ui?.menuItem })]"
              @click="selectItem(item)"
            >
              <slot name="menuItem" :item>
                <div class="flex items-center gap-3">
                  <SupaIcon v-if="item.icon" :name="item.icon" size="xs" />
                  <p>
                    {{ item.label }}
                  </p>
                </div>
              </slot>

              <div class="flex items-center justify-center min-w-4 ml-auto">
                <SupaIcon v-if="selected && item.value === selected" name="heroicons:check" size="xs" />
              </div>
            </DropdownMenuItem>
          </div>

          <slot v-if="isEmpty" name="emptyScreen">
            <div class="flex items-center justify-center gap-2 text-center p-3 flex-1 text-sm" :class="[ui?.empty]">
              <SupaIcon name="heroicons:circle-stack-20-solid" size="sm" />
              {{ emptyMessage || 'Немає елементів' }}
            </div>
          </slot>

          <slot v-if="loading" name="loadingScreen">
            <div class="flex items-center justify-center gap-2 text-center p-3 flex-1 text-sm" :class="[ui?.loading]">
              <SupaIcon size="sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  class="animate-spin text-inherit"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
              </SupaIcon>
              {{ loadingMessage || 'Завантаження...' }}
            </div>
          </slot>
        </DropdownMenuContent>
      </DropdownMenuPortal>
    </div>
  </DropdownMenuRoot>
</template>

<style scoped>
:deep(div[data-radix-menu-content][data-state='open']) {
  animation: dropdownAppear 0.15s ease;
}

@keyframes dropdownAppear {
  0% {
    opacity: 0.5;
    transform: scale(0.9);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
