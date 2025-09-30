import { sendMail } from '../src/config/mailer.js'

// Mock console.log to capture email payload logs
const originalLog = console.log
let logOutput = []

beforeAll(() => {
  console.log = (...args) => {
    // Join all arguments, handling objects properly
    const output = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ')
    logOutput.push(output)
  }
})

afterAll(() => {
  console.log = originalLog
})

beforeEach(() => {
  logOutput = []
})

describe('Mailer Configuration', () => {
  describe('sendMail', () => {
    it('should log email payload when SMTP is not configured', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Subject',
        html: '<p>Test email</p>'
      }

      await sendMail(emailData)
      
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toContain('SMTP not configured')
      expect(logOutput[0]).toContain(emailData.to)
      expect(logOutput[0]).toContain(emailData.subject)
      expect(logOutput[0]).toContain(emailData.html)
    })

    it('should handle email with different content types', async () => {
      const emailData = {
        to: 'recipient@example.com',
        subject: 'Different Subject',
        html: '<h1>HTML Content</h1><p>With multiple elements</p>'
      }

      await sendMail(emailData)
      
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toContain('recipient@example.com')
      expect(logOutput[0]).toContain('Different Subject')
      expect(logOutput[0]).toContain('<h1>HTML Content</h1>')
    })

    it('should handle email with special characters', async () => {
      const emailData = {
        to: 'special@example.com',
        subject: 'Special Chars: àáâãäå & symbols !@#$%',
        html: '<p>Content with émojis 🚀 and symbols</p>'
      }

      await sendMail(emailData)
      
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toContain('Special Chars')
      expect(logOutput[0]).toContain('émojis')
    })

    it('should handle long email content', async () => {
      const longContent = 'Lorem ipsum '.repeat(100)
      const emailData = {
        to: 'long@example.com',
        subject: 'Long Content Email',
        html: `<p>${longContent}</p>`
      }

      await sendMail(emailData)
      
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toContain('Long Content Email')
    })

    it('should handle missing optional fields gracefully', async () => {
      const minimalEmail = {
        to: 'minimal@example.com'
      }

      await sendMail(minimalEmail)
      
      expect(logOutput.length).toBe(1)
      expect(logOutput[0]).toContain('minimal@example.com')
    })
  })
})