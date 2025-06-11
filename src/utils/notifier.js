const axios = require('axios');
const sgMail = require('@sendgrid/mail');
const { error, info } = require('./logger');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail({ to, subject, text, html }) {
  try {
    const msg = {
      to,
      from: process.env.SENDGRID_FROM_EMAIL, // e.g., 'noreply@fortunitynxt.io'
      subject,
      text,
      html,
    };
    await sgMail.send(msg);
    info(`✅ Email sent to ${to}`);
  } catch (err) {
    error('❌ Error sending email:', err.message);
  }
}

async function sendWebhook(payload) {
  try {
    const res = await axios.post(process.env.WEBHOOK_URL, payload);
    info(`✅ Webhook sent. Response: ${res.status}`);
  } catch (err) {
    error('❌ Error sending webhook:', err.message);
  }
}

module.exports = {
  sendEmail,
  sendWebhook,
};
