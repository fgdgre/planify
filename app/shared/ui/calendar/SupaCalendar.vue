<script setup lang="ts">
import {
  CalendarCell,
  CalendarCellTrigger,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHead,
  CalendarGridRow,
  CalendarHeadCell,
  CalendarHeader,
  CalendarHeading,
  CalendarNext,
  CalendarPrev,
  CalendarRoot,
} from 'reka-ui'
import { CalendarDate, type DateValue } from '@internationalized/date'
import { errorMessage as errorMessageVariants, label as labelVariants } from '~/shared/ui/input/input'

defineProps<{
  label?: string
  defaultValue?: Date
  min?: Date
  max?: Date
  errorMessage?: string
}>()

defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const convertDateToCalendarDate = (date?: Date): DateValue | undefined =>
  date ? new CalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) : undefined

const convertCalendarDateToDate = (date?: DateValue): Date | undefined =>
  date ? new Date(Date.UTC(date.year, date.month - 1, date.day, 0, 0, 0)) : undefined

const date = defineModel({
  get(value: Date) {
    return convertDateToCalendarDate(value)
  },
  set(value: DateValue) {
    return convertCalendarDateToDate(value)
  },
  required: true,
})

const weekDays = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'нд']
</script>

<template>
  <div>
    <p v-if="label" :class="[labelVariants({ error: !!errorMessage })]">{{ label }}</p>

    <CalendarRoot
      :weekDays
      locale="uk"
      class="rounded-md bg-modal p-4 shadow-sm border w-fit"
      v-slot="{ grid }"
      :class="[errorMessage ? 'border-error' : 'border-border']"
      fixed-weeks
      :min="convertDateToCalendarDate(min)"
      :max="convertDateToCalendarDate(max)"
      :defaultValue="convertDateToCalendarDate(defaultValue)"
      v-model="date"
      :weekStartsOn="0"
      :aria-invalid="Boolean(errorMessage)"
      :aria-describedby="errorMessage"
    >
      <CalendarHeader class="flex items-center justify-between">
        <CalendarPrev
          class="inline-flex items-center cursor-pointer text-foreground justify-center rounded-[9px] bg-transparent w-8 h-8 hover:bg-foreground hover:text-background transition-colors"
        >
          <SupaIcon name="radix-icons:chevron-left" class="w-6 h-6" />
        </CalendarPrev>
        <CalendarHeading class="text-[15px] text-foreground font-medium" />

        <CalendarNext
          class="inline-flex items-center cursor-pointer justify-center text-foreground rounded-[9px] bg-transparent w-8 h-8 hover:bg-foreground hover:text-background transition-colors"
        >
          <SupaIcon name="radix-icons:chevron-right" class="w-6 h-6" />
        </CalendarNext>
      </CalendarHeader>
      <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
        <CalendarGrid
          v-for="month in grid"
          :key="month.value.toString()"
          class="w-full border-collapse select-none space-y-1"
        >
          <CalendarGridHead>
            <CalendarGridRow class="mb-1 grid w-full grid-cols-7">
              <CalendarHeadCell v-for="day in weekDays" :key="day" class="rounded-md text-xs text-foreground">
                {{ day }}
              </CalendarHeadCell>
            </CalendarGridRow>
          </CalendarGridHead>
          <CalendarGridBody class="grid gap-1">
            <CalendarGridRow
              v-for="(weekDates, index) in month.rows"
              :key="`weekDate-${index}`"
              class="grid grid-cols-7 gap-1"
            >
              <CalendarCell
                v-for="weekDate in weekDates"
                :key="weekDate.toString()"
                :date="weekDate"
                class="relative text-center mx-auto text-sm"
              >
                <CalendarCellTrigger
                  :day="weekDate"
                  :month="month.value"
                  class="relative flex items-center justify-center rounded-md whitespace-nowrap text-sm font-normal text-foreground w-8 h-8 outline-none data-[outside-view]:text-foreground/30 data-[selected]:!bg-primary data-[selected]:text-[#18181b] hover:bg-foreground/10 data-[highlighted]:bg-foreground/10 cursor-pointer data-[unavailable]:pointer-events-none data-[unavailable]:text-foreground/30 data-[unavailable]:line-through before:absolute before:top-[5px] before:hidden before:rounded-full before:w-1 before:h-1 before:bg-modal data-[today]:before:block data-[today]:before:bg-[#18181b] transition-colors"
                />
              </CalendarCell>
            </CalendarGridRow>
          </CalendarGridBody>
        </CalendarGrid>
      </div>
    </CalendarRoot>
    <p v-if="errorMessage" :class="errorMessageVariants()">{{ errorMessage }}</p>
  </div>
</template>
