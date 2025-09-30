import { supabase } from '../src/services/supabaseClient.js'
import { verifyPassword, generateSalt, hashPassword } from '../src/utils/hash.js'

export const getProfile = async (req, res) => {
  const { data: users } = await supabase
    .from('users')
    .select('id, username, email, roles, profile_pic, created_at')
    .eq('id', req.userId)
    .limit(1)

  const user = users && users[0]
  if (!user) return res.status(404).json({ message: 'Not found' })

  res.json(user)
}

export const updateProfile = async (req, res) => {
  const { email, currentPassword, newPassword, profilePic } = req.body

  const { data: users } = await supabase.from('users').select('*').eq('id', req.userId).limit(1)
  const user = users && users[0]
  if (!user) return res.status(404).json({ message: 'Not found' })

  if ((email && email !== user.email) || newPassword) {
    if (!currentPassword || !verifyPassword(currentPassword, user.salt, user.password_hash)) {
      return res.status(401).json({ message: 'Invalid current password' })
    }
  }

  let newSalt = user.salt
  let newHash = user.password_hash

  if (newPassword) {
    newSalt = generateSalt()
    newHash = hashPassword(newPassword, newSalt)
  }

  await supabase.from('users').update({
    email: email || user.email,
    salt: newSalt,
    password_hash: newHash,
    profile_pic: profilePic || user.profile_pic,
    refresh_token: null
  }).eq('id', req.userId)

  res.json({ message: 'Profile updated' })
}

export const deleteAccount = async (req, res) => {
  const { currentPassword } = req.body

  const { data: users } = await supabase.from('users').select('*').eq('id', req.userId).limit(1)
  const user = users && users[0]
  if (!user) return res.status(404).json({ message: 'Not found' })

  if (!currentPassword || !verifyPassword(currentPassword, user.salt, user.password_hash)) {
    return res.status(401).json({ message: 'Invalid password' })
  }

  await supabase.from('users').delete().eq('id', req.userId)
  res.json({ message: 'Account deleted' })
}