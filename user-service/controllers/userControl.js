import { supabase } from '../src/services/supabaseClient.js'
import { verifyPassword, generateSalt, hashPassword } from '../src/utils/hash.js'

export const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params

    const { data: users } = await supabase
      .from('users')
      .select('id, username, roles, created_at, difficulty_counts')
      .eq('username', username)
      .limit(1)

    const user = users && users[0]
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Ensure difficulty_counts has default structure
    if (!user.difficulty_counts) {
      user.difficulty_counts = { easy: 0, medium: 0, hard: 0 }
    }

    // Add isOwner flag if user is authenticated and viewing their own profile
    const isOwner = req.userId && req.userId === user.id
    
    // Only include email if it's the owner viewing their profile
    if (isOwner) {
      const { data: ownerUsers } = await supabase
        .from('users')
        .select('email')
        .eq('id', user.id)
        .limit(1)
      
      if (ownerUsers && ownerUsers[0]) {
        user.email = ownerUsers[0].email
      }
    }

    res.json({ 
      success: true,
      data: { ...user, isOwner }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    })
  }
}

export const updateProfileByUsername = async (req, res) => {
  try {
    const { username: targetUsername } = req.params
    const { username, email, currentPassword, newPassword, profilePic } = req.body

    // Get target user by username
    const { data: targetUsers } = await supabase
      .from('users')
      .select('*')
      .eq('username', targetUsername)
      .limit(1)

    const targetUser = targetUsers?.[0]
    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Only allow users to update their own profile
    if (req.userId !== targetUser.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only update your own profile' 
      })
    }

    // Check if anything actually changed
    const usernameChanged = username && username !== targetUser.username
    const emailChanged = email && email !== targetUser.email
    const passwordChanged = newPassword && currentPassword
    
    if (!usernameChanged && !emailChanged && !passwordChanged && !profilePic) {
      return res.status(400).json({ 
        success: false,
        message: 'NO_CHANGES',
        code: 'NO_CHANGES'
      })
    }

    // Check if username already exists (if trying to change username)
    if (usernameChanged) {
      const { data: existingUsers } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .limit(1)
      
      if (existingUsers && existingUsers.length > 0) {
        return res.status(400).json({ 
          success: false,
          message: 'Username already taken' 
        })
      }
    }

    // Don't allow email changes for security reasons
    if (emailChanged) {
      return res.status(400).json({ 
        success: false,
        message: 'Email cannot be changed through profile update' 
      });
    }

    // Require current password for password changes only
    if (passwordChanged) {
      if (!currentPassword || !verifyPassword(currentPassword, targetUser.salt, targetUser.password_hash)) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid current password' 
        })
      }
    }



    let newSalt = targetUser.salt
    let newHash = targetUser.password_hash

    if (passwordChanged) {
      newSalt = generateSalt()
      newHash = hashPassword(newPassword, newSalt)
    }

    const updateData = {
      username: username || targetUser.username,
      email: targetUser.email, // Email cannot be changed
      salt: newSalt,
      password_hash: newHash,
    }

    // Only invalidate refresh token if password changed
    if (passwordChanged) {
      updateData.refresh_token = null
    }

    const { error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.userId)
    
    if (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to update profile',
        error: error.message 
      })
    }

    // Return updated user data (excluding sensitive fields)
    const { data: updatedUsers } = await supabase
      .from('users')
      .select('id, username, email, roles, created_at, difficulty_counts')
      .eq('id', req.userId)
      .limit(1)

    const updatedUser = updatedUsers && updatedUsers[0]
    
    res.json({ 
      success: true,
      message: usernameChanged ? 'Profile updated successfully' : 'Password updated successfully',
      data: {
        user: updatedUser,
        usernameChanged: usernameChanged
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    })
  }
}

export const deleteAccountByUsername = async (req, res) => {
  try {
    const { username: targetUsername } = req.params
    const { currentPassword } = req.body

    if (!currentPassword) {
      return res.status(400).json({ 
        success: false,
        message: 'Current password is required' 
      })
    }

    // Get target user by username
    const { data: targetUsers } = await supabase
      .from('users')
      .select('*')
      .eq('username', targetUsername)
      .limit(1)

    const targetUser = targetUsers?.[0]
    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      })
    }

    // Only allow users to delete their own account
    if (req.userId !== targetUser.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only delete your own account' 
      })
    }

    if (!verifyPassword(currentPassword, targetUser.salt, targetUser.password_hash)) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid password' 
      })
    }

    // Delete from Supabase Auth table first (if supabase_auth_id exists)
    if (targetUser.supabase_auth_id) {
      const { error: authError } = await supabase.auth.admin.deleteUser(targetUser.supabase_auth_id)
      if (authError) {
        console.warn('Failed to delete from Supabase Auth:', authError.message)
        // Continue with custom user table deletion even if auth deletion fails
      }
    }

    // Delete from users table - we manage our own authentication system
    const { error } = await supabase.from('users').delete().eq('id', targetUser.id)
    
    if (error) {
      return res.status(500).json({ 
        success: false,
        message: 'Failed to delete user account',
        error: error.message 
      })
    }
    
    res.json({ 
      success: true,
      message: 'Account deleted successfully' 
    })
  } catch (error) {
    console.error('Delete account error:', error)
    res.status(500).json({ 
      success: false,
      message: 'Internal server error' 
    })
  }
}

