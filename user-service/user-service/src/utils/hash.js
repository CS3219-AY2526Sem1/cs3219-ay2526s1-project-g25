import crypto from 'crypto'

export function generateSalt() {
  return crypto.randomBytes(16).toString('hex')
}

export function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(salt + password).digest('hex')
}

export function verifyPassword(password, salt, expectedHash) {
  return hashPassword(password, salt) === expectedHash
}