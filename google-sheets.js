const { google } = require('googleapis');

class GoogleSheetsService {
  constructor() {
    this.sheets = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID;
    this.leadsSheetName = 'Leads';
    this.responsesSheetName = 'Responses';
    this.questionsSheetName = 'Questions';
  }

  async initialize() {
    try {
      // For service account authentication
      if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        const serviceAccountKey = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
        const auth = new google.auth.GoogleAuth({
          credentials: serviceAccountKey,
          scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });
        
        this.sheets = google.sheets({ version: 'v4', auth });
        console.log('✅ Google Sheets initialized with service account');
      } else {
        console.warn('⚠️ Google Sheets not configured. Set GOOGLE_SERVICE_ACCOUNT_KEY environment variable.');
        return false;
      }

      // Initialize sheets if they don't exist
      await this.initializeSheets();
      return true;
    } catch (error) {
      console.error('❌ Error initializing Google Sheets:', error);
      return false;
    }
  }

  async initializeSheets() {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      // Check if sheets exist, create if they don't
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });

      const existingSheets = response.data.sheets.map(sheet => sheet.properties.title);
      
      // Create missing sheets
      const sheetsToCreate = [];
      
      if (!existingSheets.includes(this.leadsSheetName)) {
        sheetsToCreate.push({
          properties: { title: this.leadsSheetName },
          data: [{
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'ID' } },
                { userEnteredValue: { stringValue: 'Phone Number' } },
                { userEnteredValue: { stringValue: 'Name' } },
                { userEnteredValue: { stringValue: 'Call SID' } },
                { userEnteredValue: { stringValue: 'Status' } },
                { userEnteredValue: { stringValue: 'Created At' } }
              ]
            }]
          }]
        });
      }

      if (!existingSheets.includes(this.responsesSheetName)) {
        sheetsToCreate.push({
          properties: { title: this.responsesSheetName },
          data: [{
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'Lead ID' } },
                { userEnteredValue: { stringValue: 'Question ID' } },
                { userEnteredValue: { stringValue: 'Question Text' } },
                { userEnteredValue: { stringValue: 'Answer' } },
                { userEnteredValue: { stringValue: 'Confidence' } },
                { userEnteredValue: { stringValue: 'Created At' } }
              ]
            }]
          }]
        });
      }

      if (!existingSheets.includes(this.questionsSheetName)) {
        sheetsToCreate.push({
          properties: { title: this.questionsSheetName },
          data: [{
            rowData: [{
              values: [
                { userEnteredValue: { stringValue: 'ID' } },
                { userEnteredValue: { stringValue: 'Question Text' } },
                { userEnteredValue: { stringValue: 'Order' } },
                { userEnteredValue: { stringValue: 'Active' } }
              ]
            }]
          }]
        });
      }

      if (sheetsToCreate.length > 0) {
        await this.sheets.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          resource: {
            requests: sheetsToCreate.map(sheet => ({
              addSheet: { sheet }
            }))
          }
        });
        console.log('✅ Created missing sheets:', sheetsToCreate.map(s => s.properties.title));
      }

      // Insert default questions if questions sheet is empty
      await this.insertDefaultQuestions();

    } catch (error) {
      console.error('❌ Error initializing sheets:', error);
    }
  }

  async insertDefaultQuestions() {
    try {
      const questions = [
        ['1', 'What is your name?', '1', 'TRUE'],
        ['2', 'What is your email address?', '2', 'TRUE'],
        ['3', 'What is your company name?', '3', 'TRUE'],
        ['4', 'What is your job title?', '4', 'TRUE'],
        ['5', 'What is your primary business need?', '5', 'TRUE'],
        ['6', 'What is your budget range for this project?', '6', 'TRUE'],
        ['7', 'When do you need this completed?', '7', 'TRUE'],
        ['8', 'How did you hear about us?', '8', 'TRUE']
      ];

      // Check if questions sheet has data
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.questionsSheetName}!A2:D`
      });

      if (!response.data.values || response.data.values.length === 0) {
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${this.questionsSheetName}!A2:D9`,
          valueInputOption: 'RAW',
          resource: { values: questions }
        });
        console.log('✅ Inserted default questions into Google Sheets');
      }
    } catch (error) {
      console.error('❌ Error inserting default questions:', error);
    }
  }

  async createLead(leadId, phoneNumber, name, callSid) {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      const values = [[
        leadId,
        phoneNumber,
        name || '',
        callSid || '',
        'active',
        new Date().toISOString()
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.leadsSheetName}!A:F`,
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ Lead saved to Google Sheets:', leadId);
    } catch (error) {
      console.error('❌ Error saving lead to Google Sheets:', error);
    }
  }

  async saveResponse(leadId, questionId, questionText, answer, confidence) {
    if (!this.sheets || !this.spreadsheetId) return;

    try {
      const values = [[
        leadId,
        questionId,
        questionText,
        answer,
        confidence || '',
        new Date().toISOString()
      ]];

      await this.sheets.spreadsheets.values.append({
        spreadsheetId: this.spreadsheetId,
        range: `${this.responsesSheetName}!A:F`,
        valueInputOption: 'RAW',
        resource: { values }
      });

      console.log('✅ Response saved to Google Sheets:', { leadId, questionId });
    } catch (error) {
      console.error('❌ Error saving response to Google Sheets:', error);
    }
  }

  async getAllLeads() {
    if (!this.sheets || !this.spreadsheetId) return [];

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.leadsSheetName}!A2:F`
      });

      if (!response.data.values) return [];

      return response.data.values.map(row => ({
        id: row[0],
        phone_number: row[1],
        name: row[2],
        call_sid: row[3],
        status: row[4],
        created_at: row[5]
      }));
    } catch (error) {
      console.error('❌ Error fetching leads from Google Sheets:', error);
      return [];
    }
  }

  async getLeadWithResponses(leadId) {
    if (!this.sheets || !this.spreadsheetId) return null;

    try {
      // Get lead data
      const leadResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.leadsSheetName}!A2:F`
      });

      const leadRow = leadResponse.data.values?.find(row => row[0] === leadId);
      if (!leadRow) return null;

      const lead = {
        id: leadRow[0],
        phone_number: leadRow[1],
        name: leadRow[2],
        call_sid: leadRow[3],
        status: leadRow[4],
        created_at: leadRow[5]
      };

      // Get responses for this lead
      const responsesResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.responsesSheetName}!A2:F`
      });

      const responses = responsesResponse.data.values
        ?.filter(row => row[0] === leadId)
        .map(row => ({
          lead_id: row[0],
          question_id: row[1],
          question_text: row[2],
          answer: row[3],
          confidence: row[4],
          created_at: row[5]
        })) || [];

      lead.responses = responses;
      return lead;
    } catch (error) {
      console.error('❌ Error fetching lead with responses from Google Sheets:', error);
      return null;
    }
  }

  async getQuestions() {
    if (!this.sheets || !this.spreadsheetId) return [];

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${this.questionsSheetName}!A2:D`
      });

      if (!response.data.values) return [];

      return response.data.values
        .filter(row => row[3] === 'TRUE') // Only active questions
        .map(row => ({
          id: parseInt(row[0]),
          text: row[1],
          order: parseInt(row[2]),
          active: row[3] === 'TRUE'
        }))
        .sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('❌ Error fetching questions from Google Sheets:', error);
      return [];
    }
  }
}

module.exports = new GoogleSheetsService();
