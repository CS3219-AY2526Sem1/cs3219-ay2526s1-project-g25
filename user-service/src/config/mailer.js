import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST
const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
const user = process.env.SMTP_USER
const pass = process.env.SMTP_PASS

const transporter = (host && port && user && pass)
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    })
  : null

export async function sendMail(opts) {
  if (!transporter) {
    console.log('SMTP not configured — email payload:', opts)
    return
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'no-reply@peerprep.local',
    ...opts
  })
}