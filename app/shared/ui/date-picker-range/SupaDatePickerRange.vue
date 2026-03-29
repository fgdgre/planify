
<script setup lang="ts">
import type { DateValue } from '@internationalized/date'
import { CalendarDate } from '@internationalized/date'
import {
  DateRangePickerArrow,
  DateRangePickerCalendar,
  DateRangePickerCell,
  DateRangePickerCellTrigger,
  DateRangePickerContent,
  DateRangePickerField,
  DateRangePickerGrid,
  DateRangePickerGridBody,
  DateRangePickerGridHead,
  DateRangePickerGridRow,
  DateRangePickerHeadCell,
  DateRangePickerHeader,
  DateRangePickerHeading,
  DateRangePickerInput,
  DateRangePickerNext,
  DateRangePickerPrev,
  DateRangePickerRoot,
  DateRangePickerTrigger,
  type DateRange,
} from 'reka-ui'
import * as inputVariants from '~/shared/ui/input/input'
import * as datePickerVariants from './date-picker'
import { sizeVariants } from '~/shared/variants/size'

const props = withDefaults(
  defineProps<{
    label?: string
    errorMessage?: string
    highlightError?: boolean
    numberOfMonths?: number
    disabled?: boolean
    fixedWeeks?: boolean
    readonly?: boolean
    minValue?: Date
    maxValue?: Date
    // defaultValue?: { start: Date; end: Date }
    // isDateUnavailable?: Date
    menuAlign?: 'start' | 'center' | 'end'
    size?: 'sm' | 'md' | 'lg' | 'xl'
    ui?: { wrapper?: string; trigger?: string; label?: string, modal?: string }
  }>(),
  {
    menuAlign: 'end',
  }
)

defineEmits<{
  'update:modelValue': [DateValue]
  blur: [Event]
}>()

type DateType = { start?: Date; end?: Date }

const convertDateToDateRange = (date?: DateType): DateRange | undefined => ({
  start:
    date && date.start
      ? new CalendarDate(date.start.getFullYear(), date.start.getMonth() + 1, date.start.getDate())
      : undefined,
  end:
    date && date.end
      ? new CalendarDate(date.end.getFullYear(), date.end.getMonth() + 1, date.end.getDate())
      : undefined,
})

const convertDateToCalendarDate = (date?: Date): DateValue | undefined =>
  date ? new CalendarDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate()) : undefined

const convertDateRangeToDate = (date?: DateRange): DateType | undefined => ({
  start:
    date && date.start ? new Date(Date.UTC(date.start.year, date.start.month - 1, date.start.day, 0, 0, 0)) : undefined,
  end: date && date.end ? new Date(Date.UTC(date.end.year, date.end.month - 1, date.end.day, 0, 0, 0)) : undefined,
})

const date = defineModel({
  get(value: { start: Date; end: Date }) {
    return convertDateToDateRange(value)
  },
  set(value: DateRange) {
    return convertDateRangeToDate(value)
  },
  required: true,
})

const inputSizeUi = computed(() => sizeVariants)
const inputLabelUi = computed(() => inputVariants.label)
const datePickerWrapperUi = computed(() => datePickerVariants.datePickerWrapperUi)
const datePickerInputUi = computed(() => datePickerVariants.datePickerInputUi)
const datePickerInputDataUi = computed(() => datePickerVariants.datePickerInputDataUi)
const datePickerTriggerButtonUi = computed(() => datePickerVariants.datePickerTriggerButtonUi)
const datePickerMenuUi = computed(() => datePickerVariants.datePickerMenuUi)
const datePickerMenuItemUi = computed(() => datePickerVariants.datePickerMenuItemUi)
const inputErrorMessageUi = computed(() => inputVariants.errorMessage)

const uuid = self.crypto.randomUUID()
</script>


<template>
  <div :class="datePickerWrapperUi({ class: ui?.wrapper })">
    <label
      v-if="label"
      :class="[inputLabelUi({ error: highlightError || Boolean(errorMessage), class: ui?.label })]"
      :for="uuid"
    >{{ label }}</label
    >

    <DateRangePickerRoot
      :id="uuid"
      :numberOfMonths
      :disabled
      :fixedWeeks
      :readonly
      v-model="date"
      :minValue="convertDateToCalendarDate(minValue)"
      :maxValue="convertDateToCalendarDate(maxValue)"
      granularity="hour"
    >
      <!-- :isDateUnavailable="convertDateToCalendarDate(isDateUnavailable)"
      :defaultValue="convertDateToDateRange(defaultValue)" -->
      <DateRangePickerField
        v-slot="{ segments }"
        :class="[
          datePickerInputUi({
            disabled: disabled,
            readonly: readonly,
            class: [ui?.trigger],
          }),
        ]"
        disabled
      >
        <DateRangePickerTrigger
          :class="[
            datePickerTriggerButtonUi({ error: highlightError || Boolean(errorMessage), class: inputSizeUi({ size }) }),
          ]"
        >
          <div :class="[datePickerInputDataUi({ error: highlightError || Boolean(errorMessage) })]">
            <template v-for="item in segments.start" :key="item.part">
              <DateRangePickerInput v-if="item.part === 'literal'" :part="item.part" type="start">
                {{ item.value }}
              </DateRangePickerInput>
              <DateRangePickerInput
                v-else
                :part="item.part"
                :class="[datePickerInputDataUi({ placeholder: true, error: highlightError || Boolean(errorMessage) })]"
                type="start"
              >
                {{ item.value }}
              </DateRangePickerInput>
            </template>
            <span class="mx-2"> - </span>
            <template v-for="item in segments.end" :key="item.part">
              <DateRangePickerInput v-if="item.part === 'literal'" :part="item.part" type="end">
                {{ item.value }}
              </DateRangePickerInput>
              <DateRangePickerInput
                v-else
                :part="item.part"
                :class="[datePickerInputDataUi({ placeholder: true, error: highlightError || Boolean(errorMessage) })]"
                type="end"
              >
                {{ item.value }}
              </DateRangePickerInput>
            </template>
          </div>

          <SupaIcon name="radix-icons:calendar" />
        </DateRangePickerTrigger>
      </DateRangePickerField>

      <p v-if="errorMessage" :class="[inputErrorMessageUi()]">
        {{ errorMessage }}
      </p>

      <DateRangePickerContent
        :side-offset="10"
        :class="datePickerMenuUi({ class: ui?.modal })"
        :align="menuAlign"
        @closeAutoFocus="(e) => $emit('blur', e)"
      >
        <DateRangePickerArrow class="fill-white" />
        <DateRangePickerCalendar v-slot="{ weekDays, grid }" class="p-4">
          <DateRangePickerHeader class="flex items-center justify-between">
            <DateRangePickerPrev :class="[datePickerMenuItemUi()]">
              <SupaIcon name="radix-icons:chevron-left" />
            </DateRangePickerPrev>

            <DateRangePickerHeading class="text-[15px] text-foreground font-medium" />
            <DateRangePickerNext :class="[datePickerMenuItemUi()]">
              <SupaIcon name="radix-icons:chevron-right" />
            </DateRangePickerNext>
          </DateRangePickerHeader>
          <div class="flex flex-col space-y-4 pt-4 sm:flex-row sm:space-x-4 sm:space-y-0">
            <DateRangePickerGrid
              v-for="month in grid"
              :key="month.value.toString()"
              class="w-full border-collapse select-none space-y-1"
            >
              <DateRangePickerGridHead>
                <DateRangePickerGridRow class="mb-1 flex w-full justify-between">
                  <DateRangePickerHeadCell
                    v-for="day in weekDays"
                    :key="day"
                    class="w-8 rounded-md text-xs !font-normal text-foreground"
                  >
                    {{ day }}
                  </DateRangePickerHeadCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridHead>
              <DateRangePickerGridBody>
                <DateRangePickerGridRow
                  v-for="(weekDates, index) in month.rows"
                  :key="`weekDate-${index}`"
                  class="flex w-full"
                >
                  <DateRangePickerCell v-for="weekDate in weekDates" :key="weekDate.toString()" :date="weekDate">
                    <DateRangePickerCellTrigger
                      :day="weekDate"
                      :month="month.value"
                      :class="[
                        datePickerMenuItemUi({
                          ceilTrigger: true,
                          class: 'rounded-full',
                        }),
                      ]"
                    />
                  </DateRangePickerCell>
                </DateRangePickerGridRow>
              </DateRangePickerGridBody>
            </DateRangePickerGrid>
          </div>
        </DateRangePickerCalendar>
      </DateRangePickerContent>
    </DateRangePickerRoot>
  </div>
</template>
