const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY, SENDGRID_FROM_EMAIL } = require('../config/env');

let isMock = false;
if (SENDGRID_API_KEY && SENDGRID_FROM_EMAIL) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.log('⚠️ SendGrid API Key or From Email is not configured. Email service running in MOCK mode.');
  isMock = true;
}

/**
 * Send an email using SendGrid (or logs to console if credentials are not configured).
 * @param {Object} params
 * @param {string} params.to - Recipient email
 * @param {string} params.subject - Email subject
 * @param {string} [params.html] - HTML content
 * @param {string} params.text - Plain text content
 */ 
exports.sendEmail = async ({ to, subject, html, text }) => { 
  const msg = {
    to: to || 'no-reply@eduflow.com',
    from: SENDGRID_FROM_EMAIL || 'no-reply@eduflow.com',
    subject,
    text,
    html: html || text
  };

  if (isMock) {
    console.log('\n================== MOCK EMAIL SENT ==================');
    console.log(`To:      ${msg.to}`);
    console.log(`From:    ${msg.from}`);
    console.log(`Subject: ${msg.subject}`);
    console.log(`Text:    ${msg.text}`);
    if (msg.html && msg.html !== msg.text) {
      console.log(`HTML:    ${msg.html}`);
    }
    console.log('=====================================================\n');
    return { success: true, mock: true };
  }

  try {
    await sgMail.send(msg);
    return { success: true };
  } catch (error) {
    console.error('❌ Error sending email via SendGrid:', error.message);
    if (error.response && error.response.body) {
      console.error(JSON.stringify(error.response.body));
    }
    throw error;
  }
};
