import { test, expect } from '@playwright/test'

test.describe('Auth pages', () => {
  test('login page loads with email and password inputs', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: 'Login to Planify' })).toBeVisible()
    await expect(page.getByTestId('email-input')).toBeVisible()
    await expect(page.getByTestId('password-input')).toBeVisible()
  })

  test('shows validation errors when submitting an empty login form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: 'Login' }).click()

    await expect(page.getByText('Email is required.')).toBeVisible()
    await expect(page.getByText('Password is required.')).toBeVisible()
  })

  test('navigates from login to signup via the marketing link', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: 'Sign up for Planify' }).click()

    await expect(page).toHaveURL(/\/signup$/)
  })

  test('forgot-password link from login routes to the reset email form', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('link', { name: 'Forgot password?' }).click()

    await expect(page).toHaveURL(/\/forgot-password$/)
    await expect(page.getByTestId('email-input')).toBeVisible()
  })
})
