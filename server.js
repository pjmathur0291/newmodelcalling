// server.js (CommonJS)
const express = require("express");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
const path = require("path");
const twilio = require("twilio");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const baseUrl = process.env.APP_BASE_URL; // e.g., https://abcd-1234.ngrok-free.app

// Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Simple phone validator for E.164 format
function toE164(num) {
  const trimmed = (num || "").replace(/[^\d+]/g, "");
  if (!trimmed.startsWith("+")) return null;
  return trimmed;
}

// Home (serves public/index.html by default because of express.static)
app.get("/", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/**
 * STEP A: Form posts here with { name, phone, ... }
 * We trigger an outbound call to the user. Twilio will fetch TwiML from our /voice endpoint.
 */
app.post("/api/call-user", async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;

    const to = toE164(phoneNumber);
    if (!to) {
      return res.status(400).json({ success: false, error: "Phone must be in E.164 format (e.g. +14155552671)" });
    }
    if (!baseUrl) {
      return res.status(500).json({ success: false, error: "APP_BASE_URL is not set in .env" });
    }

    // Optional: pass query params to /voice so you can personalize greeting
    const voiceUrl = `${baseUrl}/voice?name=${encodeURIComponent(name || "")}`;

    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: voiceUrl, // Twilio will GET this URL to retrieve TwiML
      // machineDetection: 'Enable', // optional
    });

    return res.json({ success: true, callSid: call.sid });
  } catch (err) {
    console.error("Error creating call:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * STEP B: Twilio hits this webhook to get TwiML for the live call.
 * For now, this is a simple "AI agent" placeholder using <Say> + <Gather speech>.
 * You can later replace with a streaming AI pipeline.
 */
app.post("/voice", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  const name = (req.query.name || "").trim();
  const greeting = name ? `Hello ${name}.` : "Hello.";

  // Welcome + prompt user to speak. Twilio will transcribe a short response.
  const gather = twiml.gather({
    input: "speech",
    timeout: 4,
    speechTimeout: "auto",
    action: "/voice/handle-speech", // Twilio will POST user speech transcript here
    method: "POST",
  });
  gather.say(
    `${greeting} I am your AI assistant. Please tell me what you need help with.`
  );

  // If nothing said, retry quickly
  twiml.redirect("/voice/retry");

  res.type("text/xml").send(twiml.toString());
});

app.post("/voice/retry", (_req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    timeout: 4,
    speechTimeout: "auto",
    action: "/voice/handle-speech",
    method: "POST",
  });
  gather.say("I didn't catch that. Please say your request after the beep.");
  res.type("text/xml").send(twiml.toString());
});

/**
 * STEP C: Handle the user's speech from Twilio STT.
 * For demo, we just repeat back the transcript and end the call.
 * You can route this text to your LLM/agent and <Say> their answer.
 */
app.post("/voice/handle-speech", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const speechResult = (req.body.SpeechResult || "").trim();

  if (!speechResult) {
    twiml.say("Sorry, I didn't hear anything. Goodbye!");
    return res.type("text/xml").send(twiml.toString());
  }

  // TODO: Send 'speechResult' to your AI model and replace the response below:
  twiml.say(`You said: ${speechResult}. Thanks! A team member will follow up shortly. Goodbye!`);
  res.type("text/xml").send(twiml.toString());
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
