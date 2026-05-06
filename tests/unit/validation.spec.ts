import { describe, it, expect } from 'vitest'
import {
  validateField,
  validateForm,
  validateRequired,
  validateMatchWith,
} from '@features/validation'

describe('validateRequired', () => {
  it('accepts non-empty strings', () => {
    expect(validateRequired('hello')).toBe(true)
  })

  it('rejects whitespace-only strings', () => {
    expect(validateRequired('   ')).toBe(false)
  })

  it('rejects null and undefined', () => {
    expect(validateRequired(null)).toBe(false)
    expect(validateRequired(undefined)).toBe(false)
  })

  it('rejects empty arrays', () => {
    expect(validateRequired([])).toBe(false)
  })

  it('accepts non-zero numbers and zero', () => {
    expect(validateRequired(0)).toBe(true)
    expect(validateRequired(42)).toBe(true)
  })

  it('rejects NaN', () => {
    expect(validateRequired(NaN)).toBe(false)
  })
})

describe('validateMatchWith', () => {
  it('returns true for equal primitives', () => {
    expect(validateMatchWith({ value: 'abc', matchWith: 'abc' })).toBe(true)
  })

  it('returns false for unequal primitives', () => {
    expect(validateMatchWith({ value: 'abc', matchWith: 'abd' })).toBe(false)
  })

  it('compares objects deeply', () => {
    expect(validateMatchWith({ value: { a: 1, b: 2 }, matchWith: { a: 1, b: 2 } })).toBe(true)
    expect(validateMatchWith({ value: { a: 1 }, matchWith: { a: 2 } })).toBe(false)
  })
})

describe('validateField', () => {
  it('returns success when no rules are passed', () => {
    expect(validateField('anything')).toEqual({ success: true })
  })

  it('returns required error when value is empty', () => {
    const result = validateField('', { required: { message: 'Email is required' } })
    expect(result).toEqual({ success: false, error: 'Email is required' })
  })

  it('skips other validators when value is empty and not required', () => {
    const result = validateField('', { email: { message: 'Invalid email' } })
    expect(result).toEqual({ success: true })
  })

  it('returns email error for invalid email', () => {
    const result = validateField('not-an-email', { email: { message: 'Invalid email' } })
    expect(result).toMatchObject({ success: false, error: 'Invalid email' })
  })

  it('passes a valid email', () => {
    const result = validateField('user@example.com', { email: { message: 'Invalid email' } })
    expect(result).toEqual({ success: true })
  })

  it('enforces minimum length', () => {
    const result = validateField('ab', {
      length: { min: { value: 3, message: 'Too short' } },
    })
    expect(result).toEqual({ success: false, error: 'Too short' })
  })
})

describe('validateForm', () => {
  it('returns success: true when all fields pass', () => {
    const result = validateForm(
      { email: 'a@b.co', password: 'secret' },
      {
        email: { required: { message: 'Email is required' } },
        password: { required: { message: 'Password is required' } },
      }
    )
    expect(result).toEqual({ success: true, error: null })
  })

  it('aggregates errors per field', () => {
    const result = validateForm(
      { email: '', password: '' },
      {
        email: { required: { message: 'Email is required' } },
        password: { required: { message: 'Password is required' } },
      }
    )
    expect(result.success).toBe(false)
    expect(result.error).toEqual({
      email: 'Email is required',
      password: 'Password is required',
    })
  })

  it('only reports errors for fields with rules', () => {
    const result = validateForm(
      { email: '', other: '' },
      { email: { required: { message: 'Email is required' } } }
    )
    expect(result.error).toEqual({ email: 'Email is required' })
  })
})
