import './config/env.js'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

import authRoutes from '../routes/auth.js'
import userRoutes from '../routes/user.js'
import tokenRoutes from '../routes/token.js'
import difficultyRoutes from '../routes/difficulty.js'
const PORT = process.env.PORT || 3001

const app = express()
app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/api/token', tokenRoutes)
app.use('/api/difficulty', difficultyRoutes)

app.get('/', (req, res) => res.json({ service: 'user-service', ok: true }))

// Only listen if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`User service running on port ${PORT}`))
}

export default app