import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export default async function handler(req, res) {
  if (req.method === "POST") {
    let { phone } = req.body;

    // Ensure phone is in E.164 format with +91
    if (!phone.startsWith("+")) {
      phone = `+91${phone}`;
    }

    try {
      const call = await client.calls.create({
        to: phone,
        from: process.env.TWILIO_PHONE_NUMBER,
        url: "https://your-vercel-app.vercel.app/api/voice"
      });

      res.status(200).json({ success: true, callSid: call.sid });
    } catch (err) {
      console.error("Twilio Error:", err);
      res.status(500).json({ error: err.message });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
