import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AccountSession,
  createSupabaseAccountBackend,
  type AccountBackend,
  type AccountState,
} from './AccountSession'

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function backend(overrides: Partial<AccountBackend> = {}): AccountBackend {
  return {
    restoreUser: vi.fn(async () => null),
    subscribe: vi.fn(() => vi.fn()),
    signUp: vi.fn(async () => ({ id: 'user-1' })),
    signIn: vi.fn(async () => ({ id: 'user-1' })),
    signOut: vi.fn(async () => undefined),
    loadProfile: vi.fn(async () => ({ id: 'user-1', displayName: 'Ranger' })),
    ...overrides,
  }
}

describe('createSupabaseAccountBackend', () => {
  it('forwards exact signup fields and maps the owner profile without retaining credentials', async () => {
    const signUp = vi.fn(async () => ({
      data: { user: { id: 'user-7' }, session: { user: { id: 'user-7' } } },
      error: null,
    }))
    const single = vi.fn(async () => ({
      data: { id: 'user-7', display_name: 'Ash Walker' },
      error: null,
    }))
    const eq = vi.fn(() => ({ single }))
    const select = vi.fn(() => ({ eq }))
    const client = {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn(),
        signUp,
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
      },
      from: vi.fn(() => ({ select })),
    }
    const gateway = createSupabaseAccountBackend(client as never)

    const user = await gateway.signUp({
      displayName: ' Ash Walker ',
      email: 'ash@example.test',
      password: 'not-a-real-secret',
    })
    const profile = await gateway.loadProfile(user.id)

    expect(signUp).toHaveBeenCalledWith({
      email: 'ash@example.test',
      password: 'not-a-real-secret',
      options: { data: { display_name: 'Ash Walker' } },
    })
    expect(client.from).toHaveBeenCalledWith('profiles')
    expect(select).toHaveBeenCalledWith('id, display_name')
    expect(eq).toHaveBeenCalledWith('id', 'user-7')
    expect(profile).toEqual({ id: 'user-7', displayName: 'Ash Walker' })
  })
})

describe('AccountSession', () => {
  let states: AccountState[]

  beforeEach(() => {
    states = []
  })

  it('keeps unconfigured boot unavailable without loading Supabase', async () => {
    const loadBackend = vi.fn(async () => backend())
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => false,
      loadBackend,
    })

    await session.initialize()

    expect(loadBackend).not.toHaveBeenCalled()
    expect(session.state).toEqual({ status: 'unavailable', busy: false, error: '' })
  })

  it('restores a configured owner profile and subscribes once', async () => {
    const unsubscribe = vi.fn()
    const source = backend({
      restoreUser: vi.fn(async () => ({ id: 'user-1' })),
      subscribe: vi.fn(() => unsubscribe),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })

    await session.initialize()
    await session.initialize()

    expect(source.restoreUser).toHaveBeenCalledOnce()
    expect(source.subscribe).toHaveBeenCalledOnce()
    expect(source.loadProfile).toHaveBeenCalledWith('user-1')
    expect(session.state).toEqual({
      status: 'authenticated',
      busy: false,
      error: '',
      profile: { id: 'user-1', displayName: 'Ranger' },
    })
    session.dispose()
    expect(unsubscribe).toHaveBeenCalledOnce()
  })

  it('validates account input before touching the backend', async () => {
    const source = backend()
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    await session.submit('create', {
      displayName: ' ',
      email: 'not-email',
      password: 'short',
    })

    expect(source.signUp).not.toHaveBeenCalled()
    expect(session.state.error).toBe('Enter a display name between 1 and 24 characters.')
  })

  it('creates an authenticated profile and never retains the password in state', async () => {
    const source = backend()
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    await session.submit('create', {
      displayName: ' Ranger ',
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })

    expect(source.signUp).toHaveBeenCalledWith({
      displayName: 'Ranger',
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })
    expect(session.state.status).toBe('authenticated')
    expect(JSON.stringify(states)).not.toContain('not-a-real-secret')
  })

  it('signs in, signs out, and returns to anonymous state', async () => {
    const source = backend()
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    await session.submit('sign-in', {
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })
    await session.signOut()

    expect(source.signIn).toHaveBeenCalledWith({
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })
    expect(source.signOut).toHaveBeenCalledOnce()
    expect(session.state).toEqual({ status: 'anonymous', busy: false, error: '' })
  })

  it('rejects duplicate in-flight submissions and exposes only a bounded error', async () => {
    const pending = deferred<{ id: string }>()
    const source = backend({ signIn: vi.fn(() => pending.promise) })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    const first = session.submit('sign-in', {
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })
    await session.submit('sign-in', {
      email: 'ranger@example.test',
      password: 'second-secret',
    })
    pending.resolve({ id: 'user-1' })
    await first

    expect(source.signIn).toHaveBeenCalledOnce()
    expect(JSON.stringify(states)).not.toContain('second-secret')
  })

  it('maps backend failures to an error without leaking submitted credentials', async () => {
    const source = backend({
      signIn: vi.fn(async () => { throw new Error('backend echoed not-a-real-secret') }),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    await session.submit('sign-in', {
      email: 'ranger@example.test',
      password: 'not-a-real-secret',
    })

    expect(session.state.error).toBe('Account request failed. Try again.')
    expect(JSON.stringify(session.state)).not.toContain('not-a-real-secret')
  })

  it('keeps an authenticated user able to sign out when profile loading fails', async () => {
    const source = backend({
      restoreUser: vi.fn(async () => ({ id: 'user-1' })),
      loadProfile: vi.fn(async () => { throw new Error('profile unavailable') }),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })

    await session.initialize()

    expect(session.state).toEqual({
      status: 'authenticated-error',
      busy: false,
      error: 'Account request failed. Try again.',
      userId: 'user-1',
    })
    await session.signOut()
    expect(source.signOut).toHaveBeenCalledOnce()
    expect(session.state.status).toBe('anonymous')
  })

  it('refreshes profile state from auth events', async () => {
    let onUser: ((user: { id: string } | null) => void) | undefined
    const source = backend({
      subscribe: vi.fn((callback) => {
        onUser = callback
        return vi.fn()
      }),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    onUser?.({ id: 'user-1' })

    await vi.waitFor(() => {
      expect(session.state.status).toBe('authenticated')
    })
    expect(source.loadProfile).toHaveBeenCalledWith('user-1')
  })

  it('does not let a stale auth-event profile load overwrite sign-out', async () => {
    let onUser: ((user: { id: string } | null) => void) | undefined
    const profile = deferred<{ id: string; displayName: string }>()
    const source = backend({
      subscribe: vi.fn((callback) => {
        onUser = callback
        return vi.fn()
      }),
      loadProfile: vi.fn(() => profile.promise),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()

    onUser?.({ id: 'user-1' })
    await Promise.resolve()
    await session.signOut()
    profile.resolve({ id: 'user-1', displayName: 'Stale Ranger' })
    await Promise.resolve()

    expect(session.state).toEqual({ status: 'anonymous', busy: false, error: '' })
  })

  it('does not emit a stale profile after disposal', async () => {
    let onUser: ((user: { id: string } | null) => void) | undefined
    const profile = deferred<{ id: string; displayName: string }>()
    const source = backend({
      subscribe: vi.fn((callback) => {
        onUser = callback
        return vi.fn()
      }),
      loadProfile: vi.fn(() => profile.promise),
    })
    const session = new AccountSession((state) => states.push(state), {
      isConfigured: () => true,
      loadBackend: async () => source,
    })
    await session.initialize()
    onUser?.({ id: 'user-1' })
    await Promise.resolve()
    const beforeDispose = states.length

    session.dispose()
    profile.resolve({ id: 'user-1', displayName: 'Stale Ranger' })
    await Promise.resolve()

    expect(states).toHaveLength(beforeDispose)
  })
})
