<script lang="ts" setup>
import { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger } from 'reka-ui'
import AppSidebarGroupButton from './AppSidebarGroupButton.vue'
import AppSidebarLink from './AppSidebarLink.vue'
import { tv } from 'tailwind-variants'
import type { SidebarSection } from "@entities/sidebar";

defineProps<{
  sections: SidebarSection[]
  collapseSections?: boolean
  wrapLinks?: boolean
}>()

defineEmits<{
  toggleSection: [{ name: string; value: boolean }]
  linkClick: []
}>()

const sidebarMainContent = computed(() =>
  tv({
    base: 'flex flex-col flex-1 p-2 overflow-x-hidden gap-2',
  })
)

const subLinksGroup = computed(() =>
  tv({
    base: 'flex flex-col ml-[15px] pl-2 border-l border-[rgb(39,39,42)] overflow-hidden data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp',
  })
)

const listGroupTitle = computed(() =>
  tv({
    base: 'flex flex-col justify-center text-sidebar-foreground/70 font-medium text-xs leading-[16px] h-8 pt-3',
  })
)
</script>

<template>
  <div :class="[sidebarMainContent()]">
    <CollapsibleRoot
      v-for="section in sections"
      :open="section.open && !collapseSections"
      @update:open="(v) => $emit('toggleSection', { name: section.name, value: v })"
    >
      <TransitionGroup>
        <CollapsibleTrigger :key="section.name" as-child>
          <AppSidebarGroupButton
            :name="section.name"
            :open="section.open"
            :icon="section.icon"
            :link="section.link"
            :collapse-sections
            iconSize="lg"
            :test-id="`supa-sidebar-${section.name.toLowerCase()}-button`"
          />
        </CollapsibleTrigger>

        <CollapsibleContent v-if="section.links" :key="section.name + section.icon" :class="[subLinksGroup()]">
          <template v-for="link in section.links">
            <template v-if="link.links">
              <CollapsibleRoot :open="link.open && !collapseSections" @update:open="(v) => (link.open = v)">
                <CollapsibleTrigger as-child>
                  <AppSidebarGroupButton :name="link.name" :open="link.open" :icon="link.icon" :collapse-sections />
                </CollapsibleTrigger>

                <CollapsibleContent :class="[subLinksGroup()]">
                  <!-- Maybe make tests id more unique -->
                  <AppSidebarLink
                    v-for="sublink in link.links"
                    :name="sublink.name"
                    :icon="sublink.icon"
                    :link="sublink.link!"
                    sub-list-item
                    :test-id="`supa-sidebar-${sublink.name.toLowerCase()}-sublink`"
                    :wrap="wrapLinks"
                  />
                </CollapsibleContent>
              </CollapsibleRoot>
            </template>

            <AppSidebarLink
              v-else
              @click="$emit('linkClick')"
              :name="link.name"
              :link="link.link!"
              default-icon
              :icon="link.icon"
              :wrap="wrapLinks"
              :test-id="`supa-sidebar-${link.name.toLowerCase()}-link`"
            />
          </template>
        </CollapsibleContent>
      </TransitionGroup>
    </CollapsibleRoot>
  </div>
</template>

<style scoped>
.v-move,
.v-enter-active,
.v-leave-active {
  transition: all 0.2s ease;
}

.v-enter-from,
.v-leave-to {
  opacity: 0;
  height: 0;
  padding: 0;
}
</style>
