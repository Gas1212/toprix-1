import type { SendMailOptions } from 'nodemailer'

/**
 * nodemailer est chargé à l'envoi, pas à l'import.
 *
 * Le paquet est en CommonJS et fait require("events") dès son évaluation. Sur
 * Cloudflare Workers (modules ES) cet appel échoue, et un import en tête de
 * fichier faisait planter /contact et /devis avant même l'affichage du
 * formulaire. Chargé ici, le module n'est évalué que lorsqu'un message part :
 * les pages s'affichent toujours, et un échec d'envoi reste cantonné au
 * try/catch des actions serveur.
 *
 * L'interface (transporter.sendMail) est inchangée pour les deux appelants.
 */
export const transporter = {
  async sendMail(options: SendMailOptions) {
    const { default: nodemailer } = await import('nodemailer')
    return nodemailer
      .createTransport({
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT ?? 587),
        secure: false,
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      })
      .sendMail(options)
  },
}

export const CONTACT_EMAIL = process.env.CONTACT_EMAIL!
