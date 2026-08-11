const { normalizePhone } = require('../utils/scheduling');

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required when REMINDER_SEND_MODE=twilio.`);
  return value;
}

async function sendWithTwilio({ channel, destination, message }) {
  const accountSid = requireEnvironment('TWILIO_ACCOUNT_SID');
  const authToken = requireEnvironment('TWILIO_AUTH_TOKEN');
  const normalizedDestination = normalizePhone(destination);

  if (!normalizedDestination.startsWith('+')) {
    throw new Error('Recipient phone must include a country code, for example +923001234567.');
  }

  const to = channel === 'whatsapp'
    ? `whatsapp:${normalizedDestination}`
    : normalizedDestination;
  const fromNumber = channel === 'whatsapp'
    ? requireEnvironment('TWILIO_WHATSAPP_NUMBER')
    : requireEnvironment('TWILIO_PHONE_NUMBER');
  const from = channel === 'whatsapp' && !fromNumber.startsWith('whatsapp:')
    ? `whatsapp:${fromNumber}`
    : fromNumber;

  const body = new URLSearchParams({ To: to, From: from, Body: message });
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body
    }
  );
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Twilio rejected the reminder.');
  }

  return { providerMessageId: result.sid, providerStatus: result.status };
}

async function sendReminder(payload) {
  const mode = process.env.REMINDER_SEND_MODE || 'mock';
  if (mode !== 'twilio') {
    return {
      providerMessageId: `mock-${Date.now()}`,
      providerStatus: 'sent',
      mock: true
    };
  }

  return sendWithTwilio(payload);
}

module.exports = { sendReminder };
