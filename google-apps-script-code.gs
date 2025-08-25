// Google Apps Script for AI Lead Capture System
// Deploy this as a web app to handle data storage

// Configuration
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE'; // Replace with your actual sheet ID
const LEADS_SHEET_NAME = 'Leads';
const RESPONSES_SHEET_NAME = 'Responses';
const QUESTIONS_SHEET_NAME = 'Questions';

// Default questions
const DEFAULT_QUESTIONS = [
  { id: 1, text: "What is your name?", order: 1, active: true },
  { id: 2, text: "What is your email address?", order: 2, active: true },
  { id: 3, text: "What is your company name?", order: 3, active: true },
  { id: 4, text: "What is your job title?", order: 4, active: true },
  { id: 5, text: "What is your primary business need?", order: 5, active: true },
  { id: 6, text: "What is your budget range for this project?", order: 6, active: true },
  { id: 7, text: "When do you need this completed?", order: 7, active: true },
  { id: 8, text: "How did you hear about us?", order: 8, active: true }
];

/**
 * Main function to handle web requests
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    
    switch (action) {
      case 'createLead':
        return handleCreateLead(data.data);
      case 'saveResponse':
        return handleSaveResponse(data.data);
      default:
        return createErrorResponse('Invalid action');
    }
  } catch (error) {
    return createErrorResponse('Invalid JSON: ' + error.message);
  }
}

/**
 * Handle GET requests
 */
function doGet(e) {
  try {
    const action = e.parameter.action;
    
    switch (action) {
      case 'test':
        return createSuccessResponse({ message: 'Google Apps Script is working!' });
      case 'getAllLeads':
        return handleGetAllLeads();
      case 'getLeadWithResponses':
        const leadId = e.parameter.leadId;
        return handleGetLeadWithResponses(leadId);
      case 'getQuestions':
        return handleGetQuestions();
      default:
        return createErrorResponse('Invalid action');
    }
  } catch (error) {
    return createErrorResponse('Error: ' + error.message);
  }
}

/**
 * Initialize the spreadsheet with required sheets and data
 */
function initializeSpreadsheet() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  
  // Create sheets if they don't exist
  createSheetIfNotExists(spreadsheet, LEADS_SHEET_NAME, [
    'ID', 'Phone Number', 'Name', 'Call SID', 'Status', 'Created At'
  ]);
  
  createSheetIfNotExists(spreadsheet, RESPONSES_SHEET_NAME, [
    'Lead ID', 'Question ID', 'Question Text', 'Answer', 'Confidence', 'Created At'
  ]);
  
  createSheetIfNotExists(spreadsheet, QUESTIONS_SHEET_NAME, [
    'ID', 'Question Text', 'Order', 'Active'
  ]);
  
  // Insert default questions if questions sheet is empty
  const questionsSheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);
  if (questionsSheet.getLastRow() <= 1) {
    insertDefaultQuestions(questionsSheet);
  }
  
  console.log('Spreadsheet initialized successfully');
}

/**
 * Create a sheet if it doesn't exist
 */
function createSheetIfNotExists(spreadsheet, sheetName, headers) {
  let sheet = spreadsheet.getSheetByName(sheetName);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    console.log('Created sheet: ' + sheetName);
  }
}

/**
 * Insert default questions
 */
function insertDefaultQuestions(sheet) {
  const questionsData = DEFAULT_QUESTIONS.map(q => [
    q.id, q.text, q.order, q.active ? 'TRUE' : 'FALSE'
  ]);
  
  if (questionsData.length > 0) {
    sheet.getRange(2, 1, questionsData.length, 4).setValues(questionsData);
    console.log('Inserted default questions');
  }
}

/**
 * Handle creating a new lead
 */
function handleCreateLead(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    
    const rowData = [
      data.leadId,
      data.phoneNumber,
      data.name,
      data.callSid,
      data.status,
      data.createdAt
    ];
    
    sheet.appendRow(rowData);
    
    return createSuccessResponse({ 
      message: 'Lead created successfully',
      leadId: data.leadId 
    });
  } catch (error) {
    return createErrorResponse('Error creating lead: ' + error.message);
  }
}

/**
 * Handle saving a response
 */
function handleSaveResponse(data) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(RESPONSES_SHEET_NAME);
    
    const rowData = [
      data.leadId,
      data.questionId,
      data.questionText,
      data.answer,
      data.confidence,
      data.createdAt
    ];
    
    sheet.appendRow(rowData);
    
    return createSuccessResponse({ 
      message: 'Response saved successfully',
      leadId: data.leadId,
      questionId: data.questionId
    });
  } catch (error) {
    return createErrorResponse('Error saving response: ' + error.message);
  }
}

/**
 * Handle getting all leads
 */
function handleGetAllLeads() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const leads = rows.map(row => {
      const lead = {};
      headers.forEach((header, index) => {
        lead[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
      });
      return lead;
    });
    
    return createSuccessResponse({ leads: leads });
  } catch (error) {
    return createErrorResponse('Error fetching leads: ' + error.message);
  }
}

/**
 * Handle getting a lead with responses
 */
function handleGetLeadWithResponses(leadId) {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    
    // Get lead data
    const leadsSheet = spreadsheet.getSheetByName(LEADS_SHEET_NAME);
    const leadsData = leadsSheet.getDataRange().getValues();
    const leadHeaders = leadsData[0];
    const leadRows = leadsData.slice(1);
    
    const leadRow = leadRows.find(row => row[0] === leadId);
    if (!leadRow) {
      return createErrorResponse('Lead not found');
    }
    
    const lead = {};
    leadHeaders.forEach((header, index) => {
      lead[header.toLowerCase().replace(/\s+/g, '_')] = leadRow[index];
    });
    
    // Get responses for this lead
    const responsesSheet = spreadsheet.getSheetByName(RESPONSES_SHEET_NAME);
    const responsesData = responsesSheet.getDataRange().getValues();
    const responseHeaders = responsesData[0];
    const responseRows = responsesData.slice(1);
    
    const responses = responseRows
      .filter(row => row[0] === leadId)
      .map(row => {
        const response = {};
        responseHeaders.forEach((header, index) => {
          response[header.toLowerCase().replace(/\s+/g, '_')] = row[index];
        });
        return response;
      });
    
    lead.responses = responses;
    
    return createSuccessResponse({ lead: lead });
  } catch (error) {
    return createErrorResponse('Error fetching lead: ' + error.message);
  }
}

/**
 * Handle getting questions
 */
function handleGetQuestions() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
    const sheet = spreadsheet.getSheetByName(QUESTIONS_SHEET_NAME);
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);
    
    const questions = rows
      .filter(row => row[3] === 'TRUE') // Only active questions
      .map(row => {
        const question = {};
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '_');
          question[key] = header === 'Active' ? (row[index] === 'TRUE') : row[index];
        });
        return question;
      })
      .sort((a, b) => a.order - b.order);
    
    return createSuccessResponse({ questions: questions });
  } catch (error) {
    return createErrorResponse('Error fetching questions: ' + error.message);
  }
}

/**
 * Create a success response
 */
function createSuccessResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Create an error response
 */
function createErrorResponse(message) {
  return ContentService
    .createTextOutput(JSON.stringify({ error: message }))
    .setMimeType(ContentService.MimeType.JSON);
}
