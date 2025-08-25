const { v4: uuidv4 } = require('uuid');

// In-memory storage for Vercel serverless environment
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

// Initialize database (no-op for in-memory)
function initDatabase() {
  return Promise.resolve();
}

// Create a new lead
function createLead(phoneNumber, name = null, callSid = null) {
  return new Promise((resolve) => {
    const leadId = uuidv4();
    const lead = {
      id: leadId,
      phone_number: phoneNumber,
      name: name,
      call_sid: callSid,
      status: 'active',
      created_at: new Date().toISOString()
    };
    leads.push(lead);
    resolve(leadId);
  });
}

// Get all active questions
function getQuestions() {
  return Promise.resolve(questions.filter(q => q.active));
}

// Save a response
function saveResponse(leadId, questionId, answer, confidence = null) {
  return new Promise((resolve) => {
    const response = {
      id: responses.length + 1,
      lead_id: leadId,
      question_id: questionId,
      answer: answer,
      confidence: confidence,
      created_at: new Date().toISOString()
    };
    responses.push(response);
    resolve(response.id);
  });
}

// Get lead with all responses
function getLeadWithResponses(leadId) {
  return new Promise((resolve) => {
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      resolve(null);
      return;
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
    resolve(lead);
  });
}

// Get all leads
function getAllLeads() {
  return Promise.resolve(leads.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
}

module.exports = {
  initDatabase,
  createLead,
  getQuestions,
  saveResponse,
  getLeadWithResponses,
  getAllLeads
};
