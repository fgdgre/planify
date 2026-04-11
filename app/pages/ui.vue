<template>
  <div class="p-4 select-none pb-16">
    <div class="flex gap-4 items-center mx-auto w-fit mb-6">
      <p class="text-3xl">UI cases</p>
    </div>

    <!-- Navigation -->
    <div v-if="!componentName" class="flex flex-col gap-2">
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=button">Button</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=input">Input</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=number-input">Number Input</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=textarea">Textarea</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=dropdown">Dropdown</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=checkbox">Checkbox</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=radio">Radio</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=switch">Switch</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=calendar">Calendar</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=date-picker-range">Date Picker Range</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=stepper">Stepper</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=modal">Modal</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=sidebar">Sidebar</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=toast">Toast</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=inline-alert">Inline Alert</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=progress">Progress</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=spinner">Spinner</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=skeleton">Skeleton</NuxtLink>
      <NuxtLink class="text-lg font-medium hover:underline underline-offset-4 text-foreground px-4 py-2 w-fit" to="?componentName=icon">Icon</NuxtLink>
    </div>

    <!-- BUTTON -->
    <div v-else-if="componentName === 'button'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Button</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton>Default</SupaButton>
          <SupaButton color="primary">Primary</SupaButton>
          <SupaButton color="theme">Theme</SupaButton>
          <SupaButton color="error">Error</SupaButton>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton size="sm">Small</SupaButton>
          <SupaButton size="md">Medium</SupaButton>
          <SupaButton size="lg">Large</SupaButton>
          <SupaButton size="xl">Extra Large</SupaButton>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton disabled>Disabled</SupaButton>
          <SupaButton loading>Loading</SupaButton>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Variants</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton variant="transparent">Transparent</SupaButton>
          <SupaButton outline>Outline</SupaButton>
          <SupaButton outline color="primary">Outline Primary</SupaButton>
          <SupaButton outline color="error">Outline Error</SupaButton>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton icon="i-heroicons-plus">With Icon</SupaButton>
          <SupaButton icon="i-heroicons-plus" square size="sm" />
          <SupaButton icon="i-heroicons-plus" square size="md" />
          <SupaButton icon="i-heroicons-plus" square size="lg" />
          <SupaButton icon="i-heroicons-trash" color="error" square />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Stretch</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaButton stretch="width">Stretch Width</SupaButton>
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Types</h2>
        <div class="flex gap-3 flex-wrap items-center">
          <SupaButton type="button">Button</SupaButton>
          <SupaButton type="submit" color="primary">Submit</SupaButton>
          <SupaButton type="reset" color="error">Reset</SupaButton>
        </div>
      </section>
    </div>

    <!-- INPUT -->
    <div v-else-if="componentName === 'input'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Input</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaInput v-model="inputValue" placeholder="Type something..." class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaInput v-model="inputValue" size="sm" placeholder="Small" />
          <SupaInput v-model="inputValue" size="md" placeholder="Medium" />
          <SupaInput v-model="inputValue" size="lg" placeholder="Large" />
          <SupaInput v-model="inputValue" size="xl" placeholder="Extra Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaInput v-model="inputValue" label="Email address" placeholder="email@example.com" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaInput v-model="inputValue" label="Email address" error-message="This field is required" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Leading Icon</h2>
        <SupaInput v-model="inputValue" leading-icon="i-heroicons-magnifying-glass" placeholder="Search..." class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Password</h2>
        <SupaInput v-model="inputValue" type="password" placeholder="Enter password" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaInput v-model="inputValue" disabled placeholder="Disabled" />
          <SupaInput v-model="inputValue" readonly placeholder="Readonly" />
          <SupaInput v-model="inputValue" loading placeholder="Loading" />
        </div>
      </section>
    </div>

    <!-- NUMBER INPUT -->
    <div v-else-if="componentName === 'number-input'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Number Input</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaNumberInput v-model="numberValue" placeholder="Enter number..." class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaNumberInput v-model="numberValue" size="sm" placeholder="Small" />
          <SupaNumberInput v-model="numberValue" size="md" placeholder="Medium" />
          <SupaNumberInput v-model="numberValue" size="lg" placeholder="Large" />
          <SupaNumberInput v-model="numberValue" size="xl" placeholder="Extra Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaNumberInput v-model="numberValue" label="Quantity" placeholder="0" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaNumberInput v-model="numberValue" label="Quantity" error-message="Must be a positive number" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaNumberInput v-model="numberValue" disabled placeholder="Disabled" />
          <SupaNumberInput v-model="numberValue" readonly placeholder="Readonly" />
          <SupaNumberInput v-model="numberValue" loading placeholder="Loading" />
        </div>
      </section>
    </div>

    <!-- TEXTAREA -->
    <div v-else-if="componentName === 'textarea'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Textarea</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaTextarea v-model="textareaValue" placeholder="Write something..." class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaTextarea v-model="textareaValue" size="sm" placeholder="Small" />
          <SupaTextarea v-model="textareaValue" size="md" placeholder="Medium" />
          <SupaTextarea v-model="textareaValue" size="lg" placeholder="Large" />
          <SupaTextarea v-model="textareaValue" size="xl" placeholder="Extra Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaTextarea v-model="textareaValue" label="Description" placeholder="Enter description..." class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaTextarea v-model="textareaValue" label="Description" error-message="This field is required" class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Resizable</h2>
        <SupaTextarea v-model="textareaValue" resizable placeholder="This textarea is resizable..." class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaTextarea v-model="textareaValue" disabled placeholder="Disabled" />
          <SupaTextarea v-model="textareaValue" readonly placeholder="Readonly" />
        </div>
      </section>
    </div>

    <!-- DROPDOWN -->
    <div v-else-if="componentName === 'dropdown'" class="space-y-8 pb-40">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Dropdown</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" placeholder="Select option" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" size="sm" placeholder="Small" />
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" size="md" placeholder="Medium" />
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" size="lg" placeholder="Large" />
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" size="xl" placeholder="Extra Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" label="Category" placeholder="Select category" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" label="Category" error-message="Please select an option" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Clearable</h2>
        <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" clearable placeholder="Select and clear" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sticky Placeholder</h2>
        <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" sticky-placeholder placeholder="Always visible" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Menu Align</h2>
        <div class="flex gap-3 flex-wrap">
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" menu-align="start" placeholder="Align start" class="max-w-xs" />
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" menu-align="center" placeholder="Align center" class="max-w-xs" />
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" menu-align="end" placeholder="Align end" class="max-w-xs" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaDropdown v-model="dropdownSelected" :items="dropdownItems" disabled placeholder="Disabled" />
          <SupaDropdown v-model="dropdownSelected" :items="[]" loading placeholder="Loading..." />
          <SupaDropdown v-model="dropdownSelected" :items="[]" is-empty placeholder="No options" empty-message="Nothing found" />
        </div>
      </section>
    </div>

    <!-- CHECKBOX -->
    <div v-else-if="componentName === 'checkbox'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Checkbox</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaCheckbox v-model="checkboxValue" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaCheckbox v-model="checkboxValue" label="Accept terms and conditions" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex gap-4 items-center">
          <SupaCheckbox v-model="checkboxValue" size="sm" label="Small" />
          <SupaCheckbox v-model="checkboxValue" size="md" label="Medium" />
          <SupaCheckbox v-model="checkboxValue" size="lg" label="Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex gap-4 items-center">
          <SupaCheckbox v-model="checkboxValue" color="primary" label="Primary" />
          <SupaCheckbox v-model="checkboxValue" color="error" label="Error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex gap-4 items-center">
          <SupaCheckbox :model-value="true" disabled label="Disabled checked" />
          <SupaCheckbox :model-value="false" disabled label="Disabled unchecked" />
          <SupaCheckbox v-model="checkboxValue" :indeterminate="true" label="Indeterminate" />
          <SupaCheckbox v-model="checkboxValue" :is-error="true" label="Error state" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <SupaCheckbox v-model="checkboxValue" icon="i-heroicons-star" label="Favorite" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Checkbox Group</h2>
        <SupaCheckboxGroup v-model="checkboxGroupValue" :checkbox-group="checkboxGroupItems" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Checkbox Group Horizontal</h2>
        <SupaCheckboxGroup v-model="checkboxGroupValue" :checkbox-group="checkboxGroupItems" orientation="horizontal" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Checkbox Group with Error</h2>
        <SupaCheckboxGroup v-model="checkboxGroupValue" :checkbox-group="checkboxGroupItems" error-message="Select at least one option" />
      </section>
    </div>

    <!-- RADIO -->
    <div v-else-if="componentName === 'radio'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Radio</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaRadio v-model="radioValue" value="opt1" label="Option 1" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex gap-4 items-center">
          <SupaRadio v-model="radioValue" value="s" size="sm" label="Small" />
          <SupaRadio v-model="radioValue" value="m" size="md" label="Medium" />
          <SupaRadio v-model="radioValue" value="l" size="lg" label="Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex gap-4 items-center">
          <SupaRadio v-model="radioValue" value="primary" color="primary" label="Primary" />
          <SupaRadio v-model="radioValue" value="error" color="error" label="Error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex gap-4 items-center">
          <SupaRadio :model-value="'disabled'" value="disabled" disabled label="Disabled" />
          <SupaRadio v-model="radioValue" value="err" :is-error="true" label="Error state" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Radio Group</h2>
        <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" label="Choose an option" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Radio Group Horizontal</h2>
        <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" orientation="horizontal" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Radio Group Sizes</h2>
        <div class="flex flex-col gap-4">
          <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" size="sm" orientation="horizontal" />
          <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" size="md" orientation="horizontal" />
          <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" size="lg" orientation="horizontal" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Radio Group with Error</h2>
        <SupaRadioGroup v-model="radioGroupValue" :radio-group="radioGroupItems" error-message="Please select an option" />
      </section>
    </div>

    <!-- SWITCH -->
    <div v-else-if="componentName === 'switch'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Switch</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaSwitch v-model="switchValue" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaSwitch v-model="switchValue" label="Enable notifications" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex gap-6 items-center">
          <SupaSwitch v-model="switchValue" color="default" label="Default" />
          <SupaSwitch v-model="switchValue" color="primary" label="Primary" />
          <SupaSwitch v-model="switchValue" color="error" label="Error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <SupaSwitch v-model="switchValue" icon="i-heroicons-bell" label="Notifications" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Disabled</h2>
        <div class="flex gap-6 items-center">
          <SupaSwitch :model-value="false" disabled label="Disabled off" />
          <SupaSwitch :model-value="true" disabled label="Disabled on" />
        </div>
      </section>
    </div>

    <!-- CALENDAR -->
    <div v-else-if="componentName === 'calendar'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Calendar</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaCalendar v-model="calendarValue" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaCalendar v-model="calendarValue" label="Select date" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaCalendar v-model="calendarValue" label="Select date" error-message="Date is required" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Min / Max</h2>
        <SupaCalendar v-model="calendarValue" :min="calendarMin" :max="calendarMax" label="Restricted range" />
      </section>
    </div>

    <!-- DATE PICKER RANGE -->
    <div v-else-if="componentName === 'date-picker-range'" class="space-y-8 pb-40">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Date Picker Range</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaDatePickerRange v-model="dateRangeValue" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Label</h2>
        <SupaDatePickerRange v-model="dateRangeValue" label="Date range" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Error</h2>
        <SupaDatePickerRange v-model="dateRangeValue" label="Date range" error-message="Please select a range" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaDatePickerRange v-model="dateRangeValue" size="sm" placeholder="Small" />
          <SupaDatePickerRange v-model="dateRangeValue" size="md" placeholder="Medium" />
          <SupaDatePickerRange v-model="dateRangeValue" size="lg" placeholder="Large" />
          <SupaDatePickerRange v-model="dateRangeValue" size="xl" placeholder="Extra Large" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Number of Months</h2>
        <SupaDatePickerRange v-model="dateRangeValue" :number-of-months="2" class="max-w-xs" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">States</h2>
        <div class="flex flex-col gap-3 max-w-xs">
          <SupaDatePickerRange v-model="dateRangeValue" disabled />
          <SupaDatePickerRange v-model="dateRangeValue" readonly />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Menu Align</h2>
        <div class="flex gap-3 flex-wrap">
          <SupaDatePickerRange v-model="dateRangeValue" menu-align="start" class="max-w-xs" />
          <SupaDatePickerRange v-model="dateRangeValue" menu-align="center" class="max-w-xs" />
          <SupaDatePickerRange v-model="dateRangeValue" menu-align="end" class="max-w-xs" />
        </div>
      </section>
    </div>

    <!-- STEPPER -->
    <div v-else-if="componentName === 'stepper'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Stepper</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaStepper v-model="stepperStep" :items="stepperItems" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-6">
          <SupaStepper v-model="stepperStep" :items="stepperItems" size="sm" />
          <SupaStepper v-model="stepperStep" :items="stepperItems" size="md" />
          <SupaStepper v-model="stepperStep" :items="stepperItems" size="lg" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Completed Step</h2>
        <SupaStepper v-model="stepperStep" :items="stepperItems" :completed-step="1" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Linear</h2>
        <SupaStepper v-model="stepperStep" :items="stepperItems" linear />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Without Icons (Title Only)</h2>
        <SupaStepper v-model="stepperStep" :items="stepperItems" hide-step-title-and-description />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Disabled</h2>
        <SupaStepper v-model="stepperStep" :items="stepperItems" disabled />
      </section>
    </div>

    <!-- MODAL -->
    <div v-else-if="componentName === 'modal'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Modal</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaButton @click="modalOpen = true">Open Modal</SupaButton>
        <SupaModal v-if="modalOpen" title="Default Modal" @close="modalOpen = false">
          <p class="text-sm">This is the modal content.</p>
          <template #actions>
            <SupaButton @click="modalOpen = false">Cancel</SupaButton>
            <SupaButton color="primary" @click="modalOpen = false">Confirm</SupaButton>
          </template>
        </SupaModal>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Fullscreen</h2>
        <SupaButton @click="modalFullscreenOpen = true">Open Fullscreen Modal</SupaButton>
        <SupaModal v-if="modalFullscreenOpen" title="Fullscreen Modal" fullscreen @close="modalFullscreenOpen = false">
          <p class="text-sm">This modal takes up the full screen.</p>
          <template #actions>
            <SupaButton @click="modalFullscreenOpen = false">Close</SupaButton>
          </template>
        </SupaModal>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Close Button</h2>
        <SupaButton @click="modalWithCloseOpen = true">Open Modal with Close Button</SupaButton>
        <SupaModal v-if="modalWithCloseOpen" title="Modal with Close Button" show-close-button @close="modalWithCloseOpen = false">
          <p class="text-sm">This modal has a close button in the header.</p>
        </SupaModal>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Prevent Close</h2>
        <SupaButton @click="modalPreventCloseOpen = true">Open Prevent Close Modal</SupaButton>
        <SupaModal v-if="modalPreventCloseOpen" title="Prevent Close Modal" prevent-close show-close-button @close="modalPreventCloseOpen = false">
          <p class="text-sm">Clicking the backdrop will not close this modal.</p>
          <template #actions>
            <SupaButton color="primary" @click="modalPreventCloseOpen = false">Close Manually</SupaButton>
          </template>
        </SupaModal>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <SupaButton @click="modalWithIconOpen = true">Open Modal with Icon</SupaButton>
        <SupaModal v-if="modalWithIconOpen" title="Modal with Icon" icon="i-heroicons-information-circle" show-close-button @close="modalWithIconOpen = false">
          <p class="text-sm">This modal has an icon in the title area.</p>
        </SupaModal>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Scrollable Content</h2>
        <SupaButton @click="modalScrollableOpen = true">Open Scrollable Modal</SupaButton>
        <SupaModal v-if="modalScrollableOpen" title="Scrollable Modal" scrollable-content show-close-button @close="modalScrollableOpen = false">
          <div class="space-y-4">
            <p v-for="i in 20" :key="i" class="text-sm">Paragraph {{ i }}: Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
          </div>
        </SupaModal>
      </section>
    </div>

    <!-- SIDEBAR -->
    <div v-else-if="componentName === 'sidebar'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Sidebar</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Left Sidebar</h2>
        <SupaButton @click="sidebarLeftOpen = true">Open Left Sidebar</SupaButton>
        <SupaSidebar v-model="sidebarLeftOpen" position="left" with-close-button>
          <template #title>Left Sidebar</template>
          <template #content>
            <p class="text-sm">This is the sidebar content.</p>
          </template>
          <template #footer>
            <SupaButton stretch="width" @click="sidebarLeftOpen = false">Close</SupaButton>
          </template>
        </SupaSidebar>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Right Sidebar</h2>
        <SupaButton @click="sidebarRightOpen = true">Open Right Sidebar</SupaButton>
        <SupaSidebar v-model="sidebarRightOpen" position="right" with-close-button>
          <template #title>Right Sidebar</template>
          <template #content>
            <p class="text-sm">This is a right-positioned sidebar.</p>
          </template>
        </SupaSidebar>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Without Overlay</h2>
        <SupaButton @click="sidebarNoOverlayOpen = true">Open Without Overlay</SupaButton>
        <SupaSidebar v-model="sidebarNoOverlayOpen" :overlay="false" with-close-button>
          <template #title>No Overlay</template>
          <template #content>
            <p class="text-sm">No backdrop overlay behind this sidebar.</p>
          </template>
        </SupaSidebar>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Prevent Close</h2>
        <SupaButton @click="sidebarPreventOpen = true">Open Prevent Close Sidebar</SupaButton>
        <SupaSidebar v-model="sidebarPreventOpen" prevent-close with-close-button>
          <template #title>Prevent Close</template>
          <template #content>
            <p class="text-sm">This sidebar ignores backdrop clicks.</p>
          </template>
          <template #footer>
            <SupaButton stretch="width" @click="sidebarPreventOpen = false">Close Manually</SupaButton>
          </template>
        </SupaSidebar>
      </section>
    </div>

    <!-- TOAST -->
    <div v-else-if="componentName === 'toast'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Toast</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaToast title="Default toast" />
          <SupaToast title="Primary toast" color="primary" />
          <SupaToast title="Success toast" color="success" />
          <SupaToast title="Error toast" color="error" />
          <SupaToast title="Primary light toast" color="primary-light" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Description</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaToast title="Action completed" description="Your changes have been saved successfully." color="success" />
          <SupaToast title="Error occurred" description="Something went wrong. Please try again." color="error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaToast title="Info" description="Here is some useful information." icon="i-heroicons-information-circle" color="primary" />
          <SupaToast title="Warning" description="Please review before continuing." icon="i-heroicons-exclamation-triangle" color="error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Closable</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaToast title="Closable toast" description="You can dismiss this." color="primary" closable />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Progress</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaToast title="Auto-closing toast" description="Disappears after a few seconds." color="success" show-progress :duration="5000" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Toast Group</h2>
        <SupaButton color="primary" @click="addToast">Add Toast</SupaButton>
        <SupaToastsGroup :toasts="toastsGroupItems" @close-toast="removeToast" class="mt-4 max-w-sm" />
      </section>
    </div>

    <!-- INLINE ALERT -->
    <div v-else-if="componentName === 'inline-alert'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Inline Alert</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaInlineAlert message="Default alert message" />
          <SupaInlineAlert message="Primary alert message" color="primary" />
          <SupaInlineAlert message="Error alert message" color="error" />
          <SupaInlineAlert message="Theme alert message" color="theme" />
          <SupaInlineAlert message="Info alert message" color="info" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaInlineAlert message="Info with icon" icon="i-heroicons-information-circle" color="info" />
          <SupaInlineAlert message="Error with icon" icon="i-heroicons-x-circle" color="error" />
          <SupaInlineAlert message="Success with icon" icon="i-heroicons-check-circle" color="primary" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With List</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaInlineAlert
            message="Please fix the following errors:"
            :items="['Field name is required', 'Email is invalid', 'Password must be at least 8 characters']"
            color="error"
            icon="i-heroicons-x-circle"
          />
        </div>
      </section>
    </div>

    <!-- PROGRESS -->
    <div v-else-if="componentName === 'progress'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Progress</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Colors</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaProgress :width="60" />
          <SupaProgress :width="60" color="primary" />
          <SupaProgress :width="60" color="error" />
          <SupaProgress :width="60" color="success" />
          <SupaProgress :width="60" color="primary-light" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaProgress :width="60" size="sm" color="primary" />
          <SupaProgress :width="60" size="md" color="primary" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Infinite</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaProgress infinite color="primary" />
          <SupaProgress infinite color="error" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Error Status</h2>
        <SupaProgress :width="40" status="error" class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Backgrounds</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaProgress :width="60" background="theme" color="primary" />
          <SupaProgress :width="60" background="transparent" color="primary" />
        </div>
      </section>
    </div>

    <!-- SPINNER -->
    <div v-else-if="componentName === 'spinner'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Spinner</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex gap-6 items-center">
          <SupaSpinner size="sm" />
          <SupaSpinner size="md" />
          <SupaSpinner size="lg" />
        </div>
      </section>
    </div>

    <!-- SKELETON -->
    <div v-else-if="componentName === 'skeleton'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Skeleton</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Default</h2>
        <SupaSkeleton class="max-w-sm" />
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Different Heights</h2>
        <div class="flex flex-col gap-3 max-w-sm">
          <SupaSkeleton :height="16" />
          <SupaSkeleton :height="32" />
          <SupaSkeleton :height="64" />
          <SupaSkeleton :height="128" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">With Icon</h2>
        <SupaSkeleton :height="48" icon="i-heroicons-photo" class="max-w-sm" />
      </section>
    </div>

    <!-- ICON -->
    <div v-else-if="componentName === 'icon'" class="space-y-8">
      <NuxtLink to="?" class="text-sm underline underline-offset-4 text-foreground hover:opacity-70">← Back</NuxtLink>
      <h1 class="text-2xl font-bold">Icon</h1>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Sizes</h2>
        <div class="flex gap-4 items-center">
          <SupaIcon name="i-heroicons-star" size="xs" />
          <SupaIcon name="i-heroicons-star" size="sm" />
          <SupaIcon name="i-heroicons-star" size="md" />
          <SupaIcon name="i-heroicons-star" size="lg" />
          <SupaIcon name="i-heroicons-star" size="xl" />
        </div>
      </section>

      <section class="space-y-2">
        <h2 class="text-lg font-semibold border-b border-border pb-1 mb-3">Various Icons</h2>
        <div class="flex gap-4 items-center flex-wrap">
          <SupaIcon name="i-heroicons-home" />
          <SupaIcon name="i-heroicons-user" />
          <SupaIcon name="i-heroicons-bell" />
          <SupaIcon name="i-heroicons-cog-6-tooth" />
          <SupaIcon name="i-heroicons-trash" />
          <SupaIcon name="i-heroicons-pencil" />
          <SupaIcon name="i-heroicons-plus" />
          <SupaIcon name="i-heroicons-x-mark" />
          <SupaIcon name="i-heroicons-check" />
          <SupaIcon name="i-heroicons-magnifying-glass" />
          <SupaIcon name="i-heroicons-arrow-left" />
          <SupaIcon name="i-heroicons-arrow-right" />
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()
const componentName = computed(() => route.query.componentName as string)

// Input
const inputValue = ref('')

// Number Input
const numberValue = ref<string | number>('')

// Textarea
const textareaValue = ref('')

// Dropdown
const dropdownSelected = ref('')
const dropdownItems = [
  { label: 'Option 1', value: 'option1' },
  { label: 'Option 2', value: 'option2' },
  { label: 'Option 3', value: 'option3' },
]

// Checkbox
const checkboxValue = ref(false)
const checkboxGroupValue = ref<string[]>([])
const checkboxGroupItems = [
  { id: '1', name: 'Option A' },
  { id: '2', name: 'Option B' },
  { id: '3', name: 'Option C' },
]

// Radio
const radioValue = ref('')
const radioGroupValue = ref('')
const radioGroupItems = [
  { id: 'opt1', name: 'Option 1' },
  { id: 'opt2', name: 'Option 2' },
  { id: 'opt3', name: 'Option 3' },
]

// Switch
const switchValue = ref(false)

// Calendar
const calendarValue = ref<Date | null>(null)
const calendarMin = new Date()
const calendarMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

// Date Picker Range
const dateRangeValue = ref(null)

// Stepper
const stepperStep = ref(1)
const stepperItems = [
  { step: 1, title: 'Personal Info', description: 'Your name and contact' },
  { step: 2, title: 'Account Setup', description: 'Username and password' },
  { step: 3, title: 'Confirmation', description: 'Review your details' },
]

// Modal
const modalOpen = ref(false)
const modalFullscreenOpen = ref(false)
const modalWithCloseOpen = ref(false)
const modalPreventCloseOpen = ref(false)
const modalWithIconOpen = ref(false)
const modalScrollableOpen = ref(false)

// Sidebar
const sidebarLeftOpen = ref(false)
const sidebarRightOpen = ref(false)
const sidebarNoOverlayOpen = ref(false)
const sidebarPreventOpen = ref(false)

// Toasts
const toastsGroupItems = ref<{ id: string; title: string; description?: string; color?: 'primary' | 'error' | 'success' | 'primary-light' }[]>([])
let toastCounter = 0
const toastColors = ['primary', 'error', 'success', 'primary-light'] as const

function addToast() {
  toastCounter++
  toastsGroupItems.value.push({
    id: String(toastCounter),
    title: `Toast #${toastCounter}`,
    description: 'This is a toast notification.',
    color: toastColors[toastCounter % toastColors.length],
  })
}

function removeToast(id: string) {
  toastsGroupItems.value = toastsGroupItems.value.filter((t) => t.id !== id)
}
</script>
