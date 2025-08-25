const { v4: uuidv4 } = require('uuid');

class GoogleAppsScriptService {
  constructor() {
    this.webAppUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    this.sheetId = process.env.GOOGLE_SHEET_ID;
  }

  async initialize() {
    if (!this.webAppUrl || !this.sheetId) {
      console.warn('⚠️ Google Apps Script not configured. Set GOOGLE_APPS_SCRIPT_URL and GOOGLE_SHEET_ID environment variables.');
      return false;
    }
    
    try {
      // Test the connection
      const response = await fetch(`${this.webAppUrl}?action=test`);
      if (response.ok) {
        console.log('✅ Google Apps Script initialized successfully');
        return true;
      } else {
        console.error('❌ Google Apps Script test failed:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Error testing Google Apps Script:', error);
      return false;
    }
  }

  async createLead(leadId, phoneNumber, name, callSid) {
    if (!this.webAppUrl) return;

    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'createLead',
          data: {
            leadId,
            phoneNumber,
            name: name || '',
            callSid: callSid || '',
            status: 'active',
            createdAt: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Lead saved via Google Apps Script:', leadId);
      } else {
        console.error('❌ Error saving lead via Google Apps Script:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving lead via Google Apps Script:', error);
    }
  }

  async saveResponse(leadId, questionId, questionText, answer, confidence) {
    if (!this.webAppUrl) return;

    try {
      const response = await fetch(this.webAppUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'saveResponse',
          data: {
            leadId,
            questionId,
            questionText,
            answer,
            confidence: confidence || '',
            createdAt: new Date().toISOString()
          }
        })
      });

      if (response.ok) {
        console.log('✅ Response saved via Google Apps Script:', { leadId, questionId });
      } else {
        console.error('❌ Error saving response via Google Apps Script:', response.status);
      }
    } catch (error) {
      console.error('❌ Error saving response via Google Apps Script:', error);
    }
  }

  async getAllLeads() {
    if (!this.webAppUrl) return [];

    try {
      const response = await fetch(`${this.webAppUrl}?action=getAllLeads`);
      if (response.ok) {
        const data = await response.json();
        return data.leads || [];
      } else {
        console.error('❌ Error fetching leads via Google Apps Script:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching leads via Google Apps Script:', error);
      return [];
    }
  }

  async getLeadWithResponses(leadId) {
    if (!this.webAppUrl) return null;

    try {
      const response = await fetch(`${this.webAppUrl}?action=getLeadWithResponses&leadId=${leadId}`);
      if (response.ok) {
        const data = await response.json();
        return data.lead || null;
      } else {
        console.error('❌ Error fetching lead via Google Apps Script:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching lead via Google Apps Script:', error);
      return null;
    }
  }

  async getQuestions() {
    if (!this.webAppUrl) return [];

    try {
      const response = await fetch(`${this.webAppUrl}?action=getQuestions`);
      if (response.ok) {
        const data = await response.json();
        return data.questions || [];
      } else {
        console.error('❌ Error fetching questions via Google Apps Script:', response.status);
        return [];
      }
    } catch (error) {
      console.error('❌ Error fetching questions via Google Apps Script:', error);
      return [];
    }
  }
}

module.exports = new GoogleAppsScriptService();
