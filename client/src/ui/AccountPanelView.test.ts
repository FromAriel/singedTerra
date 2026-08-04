import { describe, expect, it, vi } from 'vitest'
import type { AccountState } from '../client/AccountSession'
import { buildAccountPanelView, type AccountPanelViewOptions } from './AccountPanelView'

function options(overrides: Partial<AccountPanelViewOptions> = {}): AccountPanelViewOptions {
  return {
    state: { status: 'anonymous', busy: false, error: '' },
    open: false,
    mode: 'sign-in',
    onOpen: vi.fn(),
    onClose: vi.fn(),
    onModeChange: vi.fn(),
    onSubmit: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  }
}

function button(root: HTMLElement, text: string): HTMLButtonElement {
  const match = [...root.querySelectorAll('button')]
    .find((candidate) => candidate.textContent === text)
  if (!(match instanceof HTMLButtonElement)) throw new Error(`Missing ${text} button`)
  return match
}

describe('buildAccountPanelView', () => {
  it('omits the account surface when Supabase is unavailable', () => {
    const state: AccountState = { status: 'unavailable', busy: false, error: '' }
    expect(buildAccountPanelView(options({ state }))).toBeNull()
  })

  it('renders a compact anonymous affordance and routes opening', () => {
    const onOpen = vi.fn()
    const root = buildAccountPanelView(options({ onOpen }))
    if (!root) throw new Error('Expected account affordance')

    expect(root.className).toBe('account-panel')
    button(root, 'Account').click()
    expect(onOpen).toHaveBeenCalledOnce()
    expect(root.querySelector('form')).toBeNull()
  })

  it('renders labelled sign-in controls with safe autocomplete and clears the password on submit', () => {
    const onSubmit = vi.fn()
    const root = buildAccountPanelView(options({ open: true, onSubmit }))
    if (!root) throw new Error('Expected account panel')
    const form = root.querySelector('form')
    const email = root.querySelector<HTMLInputElement>('input[type="email"]')
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')
    if (!(form instanceof HTMLFormElement) || !email || !password) throw new Error('Missing account form')

    expect(root.getAttribute('aria-label')).toBe('Player account')
    expect(email.autocomplete).toBe('email')
    expect(password.autocomplete).toBe('current-password')
    email.value = 'ranger@example.test'
    password.value = 'not-a-real-secret'
    form.requestSubmit()

    expect(onSubmit).toHaveBeenCalledWith('sign-in', {
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })
    expect(password.value).toBe('')
  })

  it('renders create-account display name and routes mode changes', () => {
    const onModeChange = vi.fn()
    const root = buildAccountPanelView(options({
      open: true,
      mode: 'create',
      onModeChange,
    }))
    if (!root) throw new Error('Expected account panel')

    const displayName = root.querySelector<HTMLInputElement>('input[name="displayName"]')
    const password = root.querySelector<HTMLInputElement>('input[type="password"]')
    expect(displayName?.maxLength).toBe(24)
    expect(displayName?.autocomplete).toBe('nickname')
    expect(password?.autocomplete).toBe('new-password')
    button(root, 'Sign in').click()
    expect(onModeChange).toHaveBeenCalledWith('sign-in')
  })

  it('disables busy submission and renders errors as text', () => {
    const state: AccountState = {
      status: 'anonymous',
      busy: true,
      error: '<img src=x onerror=alert(1)>',
    }
    const root = buildAccountPanelView(options({ open: true, state }))
    if (!root) throw new Error('Expected account panel')

    expect(button(root, 'Working…').disabled).toBe(true)
    expect(root.querySelector('.account-panel__error')?.textContent)
      .toBe('<img src=x onerror=alert(1)>')
    expect(root.querySelector('img')).toBeNull()
  })

  it('renders authenticated identity and routes sign-out without exposing a form', () => {
    const onSignOut = vi.fn()
    const state: AccountState = {
      status: 'authenticated',
      busy: false,
      error: '',
      profile: { id: 'user-1', displayName: 'Ranger' },
    }
    const root = buildAccountPanelView(options({ state, onSignOut }))
    if (!root) throw new Error('Expected authenticated account panel')

    expect(root.querySelector('.account-panel__identity')?.textContent).toContain('Ranger')
    expect(root.querySelector('form')).toBeNull()
    button(root, 'Sign out').click()
    expect(onSignOut).toHaveBeenCalledOnce()
  })

  it('keeps sign-out available when an authenticated profile cannot be loaded', () => {
    const onSignOut = vi.fn()
    const state: AccountState = {
      status: 'authenticated-error',
      busy: false,
      error: 'Account request failed. Try again.',
      userId: 'user-1',
    }
    const root = buildAccountPanelView(options({ state, onSignOut }))
    if (!root) throw new Error('Expected authenticated error panel')

    expect(root.querySelector('form')).toBeNull()
    expect(root.querySelector('[role="alert"]')?.textContent)
      .toBe('Account request failed. Try again.')
    button(root, 'Sign out').click()
    expect(onSignOut).toHaveBeenCalledOnce()
  })
})
