import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load test environment variables
const result = dotenv.config({ path: join(__dirname, '../../.env.test') })

// If no test env file, fallback to regular .env
if (result.error) {
  dotenv.config({ path: join(__dirname, '../../.env') })
}

// Set test-specific overrides
process.env.NODE_ENV = 'test'
process.env.PORT = process.env.TEST_PORT || '3002'

// Suppress environment loading messages in test mode
if (process.env.NODE_ENV === 'test') {
  const originalLog = console.log
  console.log = (...args) => {
    if (args[0]?.includes?.('Environment loaded successfully')) {
      return // Suppress this message during tests
    }
    originalLog(...args)
  }
}

export default process.env