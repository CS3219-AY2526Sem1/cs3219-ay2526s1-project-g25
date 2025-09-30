import { generateSalt, hashPassword, verifyPassword } from '../src/utils/hash.js'

describe('Hash Utilities', () => {
  describe('generateSalt', () => {
    it('should generate a salt', () => {
      const salt = generateSalt()
      expect(typeof salt).toBe('string')
      expect(salt.length).toBeGreaterThan(0)
    })

    it('should generate different salts each time', () => {
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      expect(salt1).not.toBe(salt2)
    })

    it('should generate hex string', () => {
      const salt = generateSalt()
      expect(salt).toMatch(/^[a-f0-9]+$/)
    })
  })

  describe('hashPassword', () => {
    it('should hash a password with salt', () => {
      const password = 'testpassword'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
      expect(hash).not.toBe(password)
    })

    it('should produce different hashes for different passwords', () => {
      const salt = generateSalt()
      const hash1 = hashPassword('password1', salt)
      const hash2 = hashPassword('password2', salt)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should produce different hashes for same password with different salts', () => {
      const password = 'testpassword'
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      const hash1 = hashPassword(password, salt1)
      const hash2 = hashPassword(password, salt2)
      
      expect(hash1).not.toBe(hash2)
    })

    it('should produce same hash for same password and salt', () => {
      const password = 'testpassword'
      const salt = generateSalt()
      const hash1 = hashPassword(password, salt)
      const hash2 = hashPassword(password, salt)
      
      expect(hash1).toBe(hash2)
    })

    it('should handle empty password', () => {
      const salt = generateSalt()
      const hash = hashPassword('', salt)
      
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })

    it('should handle special characters in password', () => {
      const password = 'P@ssw0rd!@#$%^&*()'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      expect(typeof hash).toBe('string')
      expect(hash.length).toBeGreaterThan(0)
    })
  })

  describe('verifyPassword', () => {
    it('should verify correct password', () => {
      const password = 'testpassword'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      const isValid = verifyPassword(password, salt, hash)
      expect(isValid).toBe(true)
    })

    it('should reject incorrect password', () => {
      const password = 'testpassword'
      const wrongPassword = 'wrongpassword'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      const isValid = verifyPassword(wrongPassword, salt, hash)
      expect(isValid).toBe(false)
    })

    it('should reject password with wrong salt', () => {
      const password = 'testpassword'
      const salt1 = generateSalt()
      const salt2 = generateSalt()
      const hash = hashPassword(password, salt1)
      
      const isValid = verifyPassword(password, salt2, hash)
      expect(isValid).toBe(false)
    })

    it('should reject password with wrong hash', () => {
      const password = 'testpassword'
      const salt = generateSalt()
      const wrongHash = hashPassword('differentpassword', salt)
      
      const isValid = verifyPassword(password, salt, wrongHash)
      expect(isValid).toBe(false)
    })

    it('should handle empty password verification', () => {
      const salt = generateSalt()
      const hash = hashPassword('', salt)
      
      const isValid = verifyPassword('', salt, hash)
      expect(isValid).toBe(true)
      
      const isInvalid = verifyPassword('nonempty', salt, hash)
      expect(isInvalid).toBe(false)
    })

    it('should handle special characters in password verification', () => {
      const password = 'P@ssw0rd!@#$%^&*()'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      const isValid = verifyPassword(password, salt, hash)
      expect(isValid).toBe(true)
    })

    it('should be case sensitive', () => {
      const password = 'TestPassword'
      const salt = generateSalt()
      const hash = hashPassword(password, salt)
      
      const isValid = verifyPassword('testpassword', salt, hash)
      expect(isValid).toBe(false)
    })
  })
})