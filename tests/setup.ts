import { config } from '@vue/test-utils'

const StubIcon = {
  name: 'SupaIcon',
  props: ['name', 'size', 'mode', 'ui', 'testId'],
  template: '<i :data-testid="testId" :data-icon="name" />',
}

const StubSpinner = {
  name: 'SupaSpinner',
  props: ['ui'],
  template: '<span data-testid="spinner" />',
}

config.global.stubs = {
  SupaIcon: StubIcon,
  SupaSpinner: StubSpinner,
}
