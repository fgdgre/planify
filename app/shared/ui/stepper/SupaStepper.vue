<script setup lang="ts">
import {
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperRoot,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from 'reka-ui'

import * as stepperVariants from './stepper'

withDefaults(
  defineProps<{
    items: {
      step: number
      title: string
      description?: string
      icon?: string
    }[]
    completedStep?: number
    defaultStep?: number
    linear?: boolean
    size?: 'sm' | 'md' | 'lg'
    disabled?: boolean
    hideStepTitleAndDescription?: boolean
    titleWithTooltip?: boolean
    ui?: {
      wrapper?: string
      item?: string
      trigger?: string
      separator?: string
      paragraphWrapper?: string
      title?: string
      description?: string
    }
  }>(),
  {
    size: 'md',
    linear: false,
    completedStep: -1,
    hideStepTitleAndDescription: false,
  }
)

const currentStep = defineModel<number>({ required: true })
</script>

<template>
  <StepperRoot
    :default-value="defaultStep"
    :linear
    :class="stepperVariants.wrapper({ class: ui?.wrapper })"
    v-model="currentStep"
  >
    <StepperItem
      v-for="item in items"
      :key="item.step"
      :class="
        stepperVariants.triggersWrapper({
          triggerSize: size,
          disabled: linear && item.step > completedStep + 1,
          class: ui?.item,
        })
      "
      :step="item.step"
      :disabled="linear && item.step > completedStep + 1"
    >
      <StepperTrigger
        v-if="!titleWithTooltip"
        :class="
          stepperVariants.trigger({
            size,
            disabled: item.step > completedStep + 1,
            active: currentStep === item.step,
            completed: item.step <= completedStep,
            class: ui?.trigger,
          })
        "
        :data-testid="`supa-stepper-trigger-${item.title.toLocaleLowerCase()}`"
      >
        <slot name="trigger">
          <StepperIndicator>
            <SupaIcon :name="item.icon" :size />
          </StepperIndicator>
        </slot>
      </StepperTrigger>

      <StepperSeparator
        v-if="item.step !== items[items.length - 1]?.step"
        :class="
          stepperVariants.separator({
            triggerSize: size,
            active: currentStep === item.step,
            completed: item.step < completedStep + 1,
            class: ui?.separator,
          })
        "
      />

      <div
        v-if="items.some((i) => i.description || i.title) && !hideStepTitleAndDescription && !titleWithTooltip"
        :class="stepperVariants.paragraphsWrapper({ triggerSize: size, class: ui?.paragraphWrapper })"
      >
        <StepperTitle :class="stepperVariants.title({ triggerSize: size, class: ui?.title })">
          {{ item.title }}
        </StepperTitle>
        <StepperDescription
          v-if="item.description"
          :class="stepperVariants.description({ triggerSize: size, class: ui?.description })"
        >
          {{ item.description }}
        </StepperDescription>
      </div>
    </StepperItem>
  </StepperRoot>
</template>
