const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const twilio = require('twilio');
const db = require('../database-vercel');
const embedRouter = require('./embed');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Twilio client - only initialize if credentials are available
let client = null;

// Debug environment variables (remove in production)
console.log('Environment check:', {
  hasAccountSid: !!process.env.TWILIO_ACCOUNT_SID,
  hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
  hasPhoneNumber: !!process.env.TWILIO_PHONE_NUMBER,
  nodeEnv: process.env.NODE_ENV
});

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('✅ Twilio client initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing Twilio client:', error);
  }
} else {
  console.warn('⚠️ Twilio credentials not found. Voice features will be disabled.');
  console.log('Missing:', {
    accountSid: !process.env.TWILIO_ACCOUNT_SID ? 'TWILIO_ACCOUNT_SID' : null,
    authToken: !process.env.TWILIO_AUTH_TOKEN ? 'TWILIO_AUTH_TOKEN' : null
  });
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
    google_apps_script_configured: !!process.env.GOOGLE_APPS_SCRIPT_URL && !!process.env.GOOGLE_SHEET_ID,
    environment: process.env.NODE_ENV || 'development',
    env_vars: {
      has_account_sid: !!process.env.TWILIO_ACCOUNT_SID,
      has_auth_token: !!process.env.TWILIO_AUTH_TOKEN,
      has_phone_number: !!process.env.TWILIO_PHONE_NUMBER,
      has_google_sheet_id: !!process.env.GOOGLE_SHEET_ID,
      has_google_apps_script_url: !!process.env.GOOGLE_APPS_SCRIPT_URL,
      account_sid_length: process.env.TWILIO_ACCOUNT_SID ? process.env.TWILIO_ACCOUNT_SID.length : 0,
      auth_token_length: process.env.TWILIO_AUTH_TOKEN ? process.env.TWILIO_AUTH_TOKEN.length : 0
    }
  });
});

// Twilio configuration test endpoint
app.get("/api/twilio-test", (req, res) => {
  const config = {
    has_account_sid: !!process.env.TWILIO_ACCOUNT_SID,
    has_auth_token: !!process.env.TWILIO_AUTH_TOKEN,
    has_phone_number: !!process.env.TWILIO_PHONE_NUMBER,
    account_sid_preview: process.env.TWILIO_ACCOUNT_SID ? 
      process.env.TWILIO_ACCOUNT_SID.substring(0, 10) + '...' : 'NOT_SET',
    phone_number: process.env.TWILIO_PHONE_NUMBER || 'NOT_SET',
    client_initialized: !!client
  };
  
  res.json({
    status: config.has_account_sid && config.has_auth_token ? 'configured' : 'not_configured',
    config: config,
    message: config.client_initialized ? 
      'Twilio is properly configured and ready to make calls' : 
      'Twilio is not configured. Check environment variables.'
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
        error: "Twilio is not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.",
        debug: {
          has_account_sid: !!process.env.TWILIO_ACCOUNT_SID,
          has_auth_token: !!process.env.TWILIO_AUTH_TOKEN,
          has_phone_number: !!process.env.TWILIO_PHONE_NUMBER,
          environment: process.env.NODE_ENV
        }
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

// Serve demo page
app.get("/demo", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/demo.html'));
});

// Embeddable form API endpoint - Direct implementation
app.get('/embed', (req, res) => {
  const {
    title = 'AI Lead Capture',
    subtitle = 'Get a personalized call from our AI assistant',
    buttonText = '📞 Start AI Call',
    theme = 'light', // light, dark, blue, green
    width = '100%',
    height = 'auto',
    apiUrl = req.protocol + '://' + req.get('host'),
    successMessage = 'Call initiated successfully! Our AI will call you shortly.',
    errorMessage = 'Something went wrong. Please try again.'
  } = req.query;

  const css = `
    .ai-lead-form {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 20px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
      background: ${theme === 'dark' ? '#1a1a1a' : theme === 'blue' ? '#f0f8ff' : theme === 'green' ? '#f0fff4' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      border: 1px solid ${theme === 'dark' ? '#333333' : '#e1e5e9'};
    }
    
    .ai-lead-form h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      font-weight: 600;
      color: ${theme === 'dark' ? '#ffffff' : '#1a1a1a'};
      text-align: center;
    }
    
    .ai-lead-form p {
      margin: 0 0 24px 0;
      font-size: 16px;
      color: ${theme === 'dark' ? '#cccccc' : '#666666'};
      text-align: center;
      line-height: 1.5;
    }
    
    .ai-lead-form .form-group {
      margin-bottom: 20px;
    }
    
    .ai-lead-form label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      font-size: 14px;
    }
    
    .ai-lead-form input {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid ${theme === 'dark' ? '#333333' : '#e1e5e9'};
      border-radius: 8px;
      font-size: 16px;
      background: ${theme === 'dark' ? '#2a2a2a' : '#ffffff'};
      color: ${theme === 'dark' ? '#ffffff' : '#333333'};
      transition: border-color 0.3s ease;
      box-sizing: border-box;
    }
    
    .ai-lead-form input:focus {
      outline: none;
      border-color: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
    }
    
    .ai-lead-form button {
      width: 100%;
      padding: 14px 24px;
      background: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .ai-lead-form button:hover {
      background: ${theme === 'blue' ? '#2563eb' : theme === 'green' ? '#059669' : '#4f46e5'};
      transform: translateY(-1px);
    }
    
    .ai-lead-form button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    
    .ai-lead-form .result {
      margin-top: 16px;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 14px;
      display: none;
    }
    
    .ai-lead-form .result.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #a7f3d0;
    }
    
    .ai-lead-form .result.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fecaca;
    }
    
    .ai-lead-form .result.loading {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #93c5fd;
    }
    
    .ai-lead-form .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid #ffffff;
      border-radius: 50%;
      border-top-color: transparent;
      animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .ai-lead-form .powered-by {
      margin-top: 16px;
      text-align: center;
      font-size: 12px;
      color: ${theme === 'dark' ? '#666666' : '#999999'};
    }
    
    .ai-lead-form .powered-by a {
      color: ${theme === 'blue' ? '#3b82f6' : theme === 'green' ? '#10b981' : '#6366f1'};
      text-decoration: none;
    }
  `;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="ai-lead-form" style="width: ${width}; height: ${height};">
        <h2>${title}</h2>
        <p>${subtitle}</p>
        
        <form id="leadForm">
          <div class="form-group">
            <label for="name">Full Name *</label>
            <input type="text" id="name" name="name" required placeholder="Enter your full name">
          </div>
          
          <div class="form-group">
            <label for="phone">Phone Number *</label>
            <input type="tel" id="phone" name="phone" required placeholder="Enter your phone number">
          </div>
          
          <button type="submit" id="submitBtn">
            <span>${buttonText}</span>
          </button>
        </form>
        
        <div id="result" class="result"></div>
        
        <div class="powered-by">
          Powered by <a href="${apiUrl}" target="_blank">AI Lead Capture</a>
        </div>
      </div>

      <script>
        document.getElementById('leadForm').addEventListener('submit', async function(e) {
          e.preventDefault();
          
          const name = document.getElementById('name').value.trim();
          const phone = document.getElementById('phone').value.trim();
          const submitBtn = document.getElementById('submitBtn');
          const resultDiv = document.getElementById('result');
          
          if (!name || !phone) {
            showResult('Please fill in both name and phone number fields.', 'error');
            return;
          }
          
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<span class="loading-spinner"></span> Initiating Call...';
          showResult('Initiating AI call... Please wait.', 'loading');
          
          try {
            const response = await fetch('${apiUrl}/api/call-user', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                name: name,
                phoneNumber: phone
              }),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('Server response:', errorText);
              showResult('${errorMessage}', 'error');
              return;
            }
            
            const result = await response.json();
            if (result.success) {
              showResult('${successMessage}', 'success');
              document.getElementById('leadForm').reset();
            } else {
              showResult(result.error || '${errorMessage}', 'error');
            }
          } catch (error) {
            console.error('Fetch error:', error);
            showResult('Network error: ' + error.message, 'error');
          } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<span>${buttonText}</span>';
          }
        });
        
        function showResult(message, type) {
          const resultDiv = document.getElementById('result');
          resultDiv.textContent = message;
          resultDiv.className = 'result ' + type;
          resultDiv.style.display = 'block';
        }
        
        // Phone number formatting
        document.getElementById('phone').addEventListener('input', function(e) {
          let value = e.target.value.replace(/\\D/g, '');
          if (value.length > 0) {
            if (value.length <= 3) {
              value = '(' + value;
            } else if (value.length <= 6) {
              value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
            } else {
              value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
            }
          }
          e.target.value = value;
        });
      </script>
    </body>
    </html>
  `;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.send(html);
});

// Add embed routes (must be after all other routes)
app.use('/', embedRouter);

// Export for Vercel
module.exports = app;
