import { supabase } from '../src/services/supabaseClient.js'

describe('Supabase Client', () => {
  it('should have a valid supabase client in test environment', () => {
    // Since we're in test environment, supabase should be configured
    expect(supabase).toBeDefined()
    expect(supabase.from).toBeInstanceOf(Function)
    expect(supabase.auth).toBeDefined()
  })

  it('should be able to interact with supabase services', () => {
    // Test that we can call supabase methods (they should exist)
    const usersQuery = supabase.from('users')
    expect(usersQuery.select).toBeInstanceOf(Function)
    expect(usersQuery.insert).toBeInstanceOf(Function)
    expect(usersQuery.update).toBeInstanceOf(Function)
    expect(usersQuery.delete).toBeInstanceOf(Function)
  })

  it('should have auth service available', () => {
    expect(supabase.auth.signUp).toBeInstanceOf(Function)
    expect(supabase.auth.signInWithPassword).toBeInstanceOf(Function)
    expect(supabase.auth.signOut).toBeInstanceOf(Function)
  })
})