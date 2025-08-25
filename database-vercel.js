const { v4: uuidv4 } = require('uuid');
const googleSheets = require('./google-sheets');

// In-memory storage for Vercel serverless environment (fallback)
let leads = [];
let questions = [
  { id: 1, text: "What is your name?", order: 1, active: true },
  { id: 2, text: "What is your email address?", order: 2, active: true },
  { id: 3, text: "What is your company name?", order: 3, active: true },
  { id: 4, text: "What is your job title?", order: 4, active: true },
  { id: 5, text: "What is your primary business need?", order: 5, active: true },
  { id: 6, text: "What is your budget range for this project?", order: 6, active: true },
  { id: 7, text: "When do you need this completed?", order: 7, active: true },
  { id: 8, text: "How did you hear about us?", order: 8, active: true }
];
let responses = [];

// Flag to track if Google Sheets is available
let googleSheetsAvailable = false;

// Initialize database
async function initDatabase() {
  try {
    // Try to initialize Google Sheets
    googleSheetsAvailable = await googleSheets.initialize();
    if (googleSheetsAvailable) {
      console.log('✅ Using Google Sheets for data storage');
    } else {
      console.log('⚠️ Using in-memory storage (Google Sheets not configured)');
    }
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    googleSheetsAvailable = false;
  }
}

// Create a new lead
async function createLead(phoneNumber, name = null, callSid = null) {
  const leadId = uuidv4();
  const lead = {
    id: leadId,
    phone_number: phoneNumber,
    name: name,
    call_sid: callSid,
    status: 'active',
    created_at: new Date().toISOString()
  };

  // Save to Google Sheets if available
  if (googleSheetsAvailable) {
    await googleSheets.createLead(leadId, phoneNumber, name, callSid);
  }

  // Also save to in-memory storage as backup
  leads.push(lead);
  return leadId;
}

// Get all active questions
async function getQuestions() {
  if (googleSheetsAvailable) {
    try {
      const sheetsQuestions = await googleSheets.getQuestions();
      if (sheetsQuestions.length > 0) {
        return sheetsQuestions;
      }
    } catch (error) {
      console.error('Error fetching questions from Google Sheets:', error);
    }
  }
  
  // Fallback to in-memory questions
  return questions.filter(q => q.active);
}

// Save a response
async function saveResponse(leadId, questionId, answer, confidence = null) {
  const response = {
    id: responses.length + 1,
    lead_id: leadId,
    question_id: questionId,
    answer: answer,
    confidence: confidence,
    created_at: new Date().toISOString()
  };

  // Save to Google Sheets if available
  if (googleSheetsAvailable) {
    try {
      const questions = await getQuestions();
      const question = questions.find(q => q.id === questionId);
      const questionText = question ? question.text : 'Unknown Question';
      await googleSheets.saveResponse(leadId, questionId, questionText, answer, confidence);
    } catch (error) {
      console.error('Error saving response to Google Sheets:', error);
    }
  }

  // Also save to in-memory storage as backup
  responses.push(response);
  return response.id;
}

// Get lead with all responses
async function getLeadWithResponses(leadId) {
  if (googleSheetsAvailable) {
    try {
      const lead = await googleSheets.getLeadWithResponses(leadId);
      if (lead) {
        return lead;
      }
    } catch (error) {
      console.error('Error fetching lead from Google Sheets:', error);
    }
  }

  // Fallback to in-memory storage
  const lead = leads.find(l => l.id === leadId);
  if (!lead) {
    return null;
  }

  const leadResponses = responses
    .filter(r => r.lead_id === leadId)
    .map(r => {
      const question = questions.find(q => q.id === r.question_id);
      return {
        ...r,
        question_text: question ? question.text : 'Unknown Question',
        question_order: question ? question.order : 0
      };
    })
    .sort((a, b) => a.question_order - b.question_order);

  lead.responses = leadResponses;
  return lead;
}

// Get all leads
async function getAllLeads() {
  if (googleSheetsAvailable) {
    try {
      const sheetsLeads = await googleSheets.getAllLeads();
      if (sheetsLeads.length > 0) {
        return sheetsLeads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } catch (error) {
      console.error('Error fetching leads from Google Sheets:', error);
    }
  }

  // Fallback to in-memory storage
  return leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

module.exports = {
  initDatabase,
  createLead,
  getQuestions,
  saveResponse,
  getLeadWithResponses,
  getAllLeads
};
