import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const result = dotenv.config({ path: join(__dirname, '../../.env') })

if (result.error) {
  console.error('Error loading .env file:', result.error)
  process.exit(1)
}

console.log('Environment loaded successfully:', {
  SUPABASE_URL: process.env.SUPABASE_URL ? 'LOADED' : 'MISSING',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'LOADED' : 'MISSING',
  PORT: process.env.PORT || 'USING_DEFAULT'
})

export default process.env