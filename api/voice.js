// api/voice.js
import twilio from "twilio";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Extract phone number (or other params) from request body
    const { to } = req.body;

    if (!to) {
      return res.status(400).json({ error: "Missing 'to' phone number" });
    }

    const call = await client.calls.create({
      url: "http://demo.twilio.com/docs/voice.xml", // replace with your TwiML webhook if needed
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });

    res.status(200).json({ success: true, call });
  } catch (error) {
    console.error("Twilio Error:", error);
    res.status(500).json({ error: error.message });
  }
}
