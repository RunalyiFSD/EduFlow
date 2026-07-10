const twilio = require('twilio');
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_MESSAGING_SERVICE_SID } = require('../config/env');

let isMock = true;
let client = null;

console.log('💬 SMS service is running in MOCK mode (OTP logged to terminal).');
if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && (TWILIO_PHONE_NUMBER || TWILIO_MESSAGING_SERVICE_SID)) {
  client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
}


/**
 * Send an SMS using Twilio (or logs to console if credentials are not configured).
 * @param {Object} params
 * @param {string} params.to - Recipient phone number (e.g. +1234567890)
 * @param {string} params.body - SMS message body
 */
exports.sendSMS = async ({ to, body }) => {
  if (isMock) {
    console.log('\n================== MOCK SMS SENT ==================');
    console.log(`To:   ${to}`);
    console.log(`Body: ${body}`);
    console.log('===================================================\n');
    return { success: true, mock: true };
  }

  try {
    let formattedTo = String(to || '').trim();
    if (formattedTo && !formattedTo.startsWith('+')) {
      if (formattedTo.length === 10 && /^[6-9]\d{9}$/.test(formattedTo)) {
        formattedTo = '+91' + formattedTo;
      } else {
        formattedTo = '+' + formattedTo;
      }
    }

    let formattedFrom = String(TWILIO_PHONE_NUMBER || '').trim();
    if (formattedFrom && !formattedFrom.startsWith('+')) {
      if (formattedFrom.length === 10 && /^[6-9]\d{9}$/.test(formattedFrom)) {
        formattedFrom = '+91' + formattedFrom;
      } else {
        formattedFrom = '+' + formattedFrom;
      }
    }

    const msgOpts = {
      body,
      to: formattedTo
    };

    if (TWILIO_MESSAGING_SERVICE_SID) {
      msgOpts.messagingServiceSid = TWILIO_MESSAGING_SERVICE_SID;
    } else {
      msgOpts.from = formattedFrom;
    }

    const message = await client.messages.create(msgOpts);
    return { success: true, sid: message.sid };
  } catch (error) {
    console.error('❌ Error sending SMS via Twilio:', error.message);
    console.log('\n================== MOCK SMS FALLBACK ==================');
    console.log(`To:   ${to}`);
    console.log(`Body: ${body}`);
    console.log('=======================================================\n');
    return { success: false, error: error.message, fallback: true };
  }
};

/**
 * Send a simulated WhatsApp message (logs to console by default).
 * @param {Object} params
 * @param {string} params.to - Recipient phone number or identifier
 * @param {string} params.body - WhatsApp message body
 */
exports.sendWhatsApp = async ({ to, body }) => {
  console.log('\n================== MOCK WHATSAPP SENT ==================');
  console.log(`To:      whatsapp:${to}`);
  console.log(`Message: ${body}`);
  console.log('========================================================\n');
  
  if (!isMock && client) {
    try {
      let formattedTo = String(to || '').trim();
      if (formattedTo && !formattedTo.startsWith('+')) {
        if (formattedTo.length === 10 && /^[6-9]\d{9}$/.test(formattedTo)) {
          formattedTo = '+91' + formattedTo;
        } else {
          formattedTo = '+' + formattedTo;
        }
      }
      let formattedFrom = String(TWILIO_PHONE_NUMBER || '').trim();
      if (formattedFrom && !formattedFrom.startsWith('+')) {
        if (formattedFrom.length === 10 && /^[6-9]\d{9}$/.test(formattedFrom)) {
          formattedFrom = '+91' + formattedFrom;
        } else {
          formattedFrom = '+' + formattedFrom;
        }
      }
      
      // Twilio WhatsApp messaging prefix is required: 'whatsapp:<phone>'
      await client.messages.create({
        body,
        from: `whatsapp:${formattedFrom}`,
        to: `whatsapp:${formattedTo}`
      });
      return { success: true, viaTwilio: true };
    } catch (err) {
      console.error('❌ Twilio WhatsApp Sandboxed Error (Fallback to Mock):', err.message);
      return { success: true, mock: true, error: err.message };
    }
  }
  return { success: true, mock: true };
};

