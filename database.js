const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Database file path
const dbPath = path.join(__dirname, 'leads.db');

// Initialize database
function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        reject(err);
        return;
      }
      
      // Create tables if they don't exist
      db.serialize(() => {
        // Leads table
        db.run(`CREATE TABLE IF NOT EXISTS leads (
          id TEXT PRIMARY KEY,
          phone_number TEXT NOT NULL,
          name TEXT,
          call_sid TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Questions table
        db.run(`CREATE TABLE IF NOT EXISTS questions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          question_text TEXT NOT NULL,
          question_order INTEGER NOT NULL,
          is_active BOOLEAN DEFAULT 1
        )`);

        // Responses table
        db.run(`CREATE TABLE IF NOT EXISTS responses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          lead_id TEXT NOT NULL,
          question_id INTEGER NOT NULL,
          answer TEXT,
          confidence REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (lead_id) REFERENCES leads (id),
          FOREIGN KEY (question_id) REFERENCES questions (id)
        )`);

        // Insert default questions if they don't exist
        db.get("SELECT COUNT(*) as count FROM questions", (err, row) => {
          if (err) {
            console.error('Error checking questions:', err);
            reject(err);
            return;
          }
          
          if (row.count === 0) {
            const defaultQuestions = [
              { text: "What is your name?", order: 1 },
              { text: "What is your email address?", order: 2 },
              { text: "What is your company name?", order: 3 },
              { text: "What is your job title?", order: 4 },
              { text: "What is your primary business need?", order: 5 },
              { text: "What is your budget range for this project?", order: 6 },
              { text: "When do you need this completed?", order: 7 },
              { text: "How did you hear about us?", order: 8 }
            ];

            const stmt = db.prepare("INSERT INTO questions (question_text, question_order) VALUES (?, ?)");
            defaultQuestions.forEach(q => stmt.run(q.text, q.order));
            stmt.finalize((err) => {
              if (err) {
                console.error('Error inserting default questions:', err);
                reject(err);
              } else {
                console.log('✅ Default questions inserted successfully');
                resolve(db);
              }
            });
          } else {
            console.log('✅ Questions table already populated');
            resolve(db);
          }
        });
      });
    });
  });
}

// Create a new lead
function createLead(phoneNumber, name = null, callSid = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    const leadId = uuidv4();
    
    db.run(
      "INSERT INTO leads (id, phone_number, name, call_sid) VALUES (?, ?, ?, ?)",
      [leadId, phoneNumber, name, callSid],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(leadId);
        }
        db.close();
      }
    );
  });
}

// Get all active questions
function getQuestions() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all(
      "SELECT * FROM questions WHERE is_active = 1 ORDER BY question_order",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      }
    );
  });
}

// Save a response
function saveResponse(leadId, questionId, answer, confidence = null) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.run(
      "INSERT INTO responses (lead_id, question_id, answer, confidence) VALUES (?, ?, ?, ?)",
      [leadId, questionId, answer, confidence],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
        db.close();
      }
    );
  });
}

// Get lead with all responses
function getLeadWithResponses(leadId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.get(
      "SELECT * FROM leads WHERE id = ?",
      [leadId],
      (err, lead) => {
        if (err) {
          reject(err);
          return;
        }
        
        if (!lead) {
          resolve(null);
          return;
        }
        
        db.all(
          `SELECT r.*, q.question_text, q.question_order 
           FROM responses r 
           JOIN questions q ON r.question_id = q.id 
           WHERE r.lead_id = ? 
           ORDER BY q.question_order`,
          [leadId],
          (err, responses) => {
            if (err) {
              reject(err);
            } else {
              lead.responses = responses;
              resolve(lead);
            }
            db.close();
          }
        );
      }
    );
  });
}

// Get all leads
function getAllLeads() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    db.all(
      "SELECT * FROM leads ORDER BY created_at DESC",
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close();
      }
    );
  });
}

module.exports = {
  initDatabase,
  createLead,
  getQuestions,
  saveResponse,
  getLeadWithResponses,
  getAllLeads
};
