import jwt from 'jsonwebtoken'
import { supabase } from '../src/services/supabaseClient.js'

const ACCESS_SECRET = process.env.JWT_ACCESS_TOKEN_SECRET || 'dev_access_secret'

// Endpoint for other services to verify tokens
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ 
        valid: false, 
        message: 'Token required' 
      })
    }

    // Verify JWT token
    const payload = jwt.verify(token, ACCESS_SECRET)
    
    // Get user details from database to ensure user still exists and is active
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, roles, is_active')
      .eq('id', payload.userId)
      .limit(1)

    if (error) {
      return res.status(500).json({ 
        valid: false, 
        message: 'Database error' 
      })
    }

    const user = users && users[0]
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        valid: false, 
        message: 'User not found or inactive' 
      })
    }

    // Return user info for the requesting service
    res.json({
      valid: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles || [],
        isAdmin: user.roles && user.roles.includes('admin')
      }
    })

  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      message: 'Invalid or expired token' 
    })
  }
}

// Middleware for other services to check admin status
export const verifyAdminToken = async (req, res) => {
  try {
    const { token } = req.body
    if (!token) {
      return res.status(400).json({ 
        valid: false, 
        isAdmin: false,
        message: 'Token required' 
      })
    }

    const payload = jwt.verify(token, ACCESS_SECRET)
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, roles, is_active')
      .eq('id', payload.userId)
      .limit(1)

    if (error) {
      return res.status(500).json({ 
        valid: false, 
        isAdmin: false,
        message: 'Database error' 
      })
    }

    const user = users && users[0]
    if (!user || !user.is_active) {
      return res.status(401).json({ 
        valid: false, 
        isAdmin: false,
        message: 'User not found or inactive' 
      })
    }

    const isAdmin = user.roles && user.roles.includes('admin')
    
    res.json({
      valid: true,
      isAdmin,
      userId: user.id,
      message: isAdmin ? 'Admin verified' : 'User verified but not admin'
    })

  } catch (error) {
    res.status(401).json({ 
      valid: false, 
      isAdmin: false,
      message: 'Invalid or expired token' 
    })
  }
}