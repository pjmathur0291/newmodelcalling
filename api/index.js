const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const twilio = require('twilio');
const db = require('../database-vercel');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Twilio client - only initialize if credentials are available
let client = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
} else {
  console.warn('⚠️ Twilio credentials not found. Voice features will be disabled.');
}

// Simple phone validator for E.164 format
function toE164(num) {
  const trimmed = (num || "").replace(/[^\d+]/g, "");
  if (!trimmed.startsWith("+")) return null;
  return trimmed;
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    twilio_configured: !!client,
    environment: process.env.NODE_ENV || 'development'
  });
});

// API endpoint to view all leads
app.get("/api/leads", async (req, res) => {
  try {
    const leads = await db.getAllLeads();
    res.json({ success: true, leads });
  } catch (err) {
    console.error("Error fetching leads:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// API endpoint to view a specific lead with responses
app.get("/api/leads/:leadId", async (req, res) => {
  try {
    const lead = await db.getLeadWithResponses(req.params.leadId);
    if (!lead) {
      return res.status(404).json({ success: false, error: "Lead not found" });
    }
    res.json({ success: true, lead });
  } catch (err) {
    console.error("Error fetching lead:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Call user endpoint
app.post("/api/call-user", async (req, res) => {
  try {
    const { phoneNumber, name } = req.body;

    const to = toE164(phoneNumber);
    if (!to) {
      return res.status(400).json({ success: false, error: "Phone must be in E.164 format (e.g. +14155552671)" });
    }

    // Check if Twilio is configured
    if (!client) {
      return res.status(500).json({ 
        success: false, 
        error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables." 
      });
    }

    // For Vercel deployment, use the request host
    const baseUrl = process.env.APP_BASE_URL || 
                   `${req.protocol}://${req.get('host')}`;

    // Create a new lead in the database
    const leadId = await db.createLead(to, name);

    // Pass leadId and name to /voice so we can track the conversation
    const voiceUrl = `${baseUrl}/voice?leadId=${encodeURIComponent(leadId)}&name=${encodeURIComponent(name || "")}`;

    const call = await client.calls.create({
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
      url: voiceUrl,
    });

    return res.json({ success: true, callSid: call.sid, leadId });
  } catch (err) {
    console.error("Error creating call:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// Voice webhook endpoint
app.post("/voice", async (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    const leadId = req.query.leadId;
    const name = (req.query.name || "").trim();
    
    if (!leadId) {
      twiml.say("Error: Lead ID not found. Goodbye!");
      return res.type("text/xml").send(twiml.toString());
    }

    const greeting = name ? `Hello ${name}.` : "Hello.";

    twiml.say(
      `${greeting} I am your AI assistant. I have a few questions to better understand your needs. Let's get started.`
    );

    twiml.redirect(`/voice/question?leadId=${encodeURIComponent(leadId)}&questionIndex=0`);

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in voice endpoint:", err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, there was an error. Please try again later. Goodbye!");
    res.type("text/xml").send(twiml.toString());
  }
});

// Question endpoint
app.post("/voice/question", async (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    const leadId = req.query.leadId;
    const questionIndex = parseInt(req.query.questionIndex) || 0;

    if (!leadId) {
      twiml.say("Error: Lead ID not found. Goodbye!");
      return res.type("text/xml").send(twiml.toString());
    }

    const questions = await db.getQuestions();
    
    if (questionIndex >= questions.length) {
      twiml.say("Thank you for answering all the questions. A team member will review your responses and contact you shortly. Have a great day!");
      return res.type("text/xml").send(twiml.toString());
    }

    const currentQuestion = questions[questionIndex];

    const gather = twiml.gather({
      input: "speech",
      timeout: 8,
      speechTimeout: "auto",
      action: `/voice/handle-answer?leadId=${encodeURIComponent(leadId)}&questionIndex=${questionIndex}`,
      method: "POST",
    });
    
    gather.say(`Question ${questionIndex + 1}: ${currentQuestion.text}`);

    twiml.redirect(`/voice/question?leadId=${encodeURIComponent(leadId)}&questionIndex=${questionIndex}`);

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in question endpoint:", err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, there was an error. Please try again later. Goodbye!");
    res.type("text/xml").send(twiml.toString());
  }
});

// Handle answer endpoint
app.post("/voice/handle-answer", async (req, res) => {
  try {
    const twiml = new twilio.twiml.VoiceResponse();
    const leadId = req.query.leadId;
    const questionIndex = parseInt(req.query.questionIndex) || 0;
    const speechResult = (req.body.SpeechResult || "").trim();
    const confidence = parseFloat(req.body.SpeechResultConfidence) || 0;

    if (!leadId) {
      twiml.say("Error: Lead ID not found. Goodbye!");
      return res.type("text/xml").send(twiml.toString());
    }

    if (!speechResult) {
      twiml.say("I didn't catch that. Let me ask the question again.");
      twiml.redirect(`/voice/question?leadId=${encodeURIComponent(leadId)}&questionIndex=${questionIndex}`);
      return res.type("text/xml").send(twiml.toString());
    }

    const questions = await db.getQuestions();
    const currentQuestion = questions[questionIndex];

    if (!currentQuestion) {
      twiml.say("Error: Question not found. Goodbye!");
      return res.type("text/xml").send(twiml.toString());
    }

    await db.saveResponse(leadId, currentQuestion.id, speechResult, confidence);

    twiml.say(`Thank you. You said: ${speechResult}`);

    const nextQuestionIndex = questionIndex + 1;
    
    if (nextQuestionIndex >= questions.length) {
      twiml.say("Perfect! That was the last question. Thank you for your time. A team member will review your responses and contact you shortly. Have a great day!");
    } else {
      twiml.redirect(`/voice/question?leadId=${encodeURIComponent(leadId)}&questionIndex=${nextQuestionIndex}`);
    }

    res.type("text/xml").send(twiml.toString());
  } catch (err) {
    console.error("Error in handle-answer endpoint:", err);
    const twiml = new twilio.twiml.VoiceResponse();
    twiml.say("Sorry, there was an error. Please try again later. Goodbye!");
    res.type("text/xml").send(twiml.toString());
  }
});

// Legacy endpoint for backward compatibility
app.post("/voice/handle-speech", (req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  const speechResult = (req.body.SpeechResult || "").trim();

  if (!speechResult) {
    twiml.say("Sorry, I didn't hear anything. Goodbye!");
    return res.type("text/xml").send(twiml.toString());
  }

  twiml.say(`You said: ${speechResult}. Thanks! A team member will follow up shortly. Goodbye!`);
  res.type("text/xml").send(twiml.toString());
});

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve admin page
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

// Export for Vercel
module.exports = app;
