import express from "express";
import twilio from "twilio";

const router = express.Router();

router.post("/", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();

  twiml.say("Hello! Your AI Voice app is now running on Node.js.", { voice: "alice" });

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;


