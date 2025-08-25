# 📊 Google Sheets Integration Setup

This guide will help you set up Google Sheets integration to store your lead data persistently.

## 🎯 Benefits

- **Persistent Storage**: Data survives server restarts
- **Easy Access**: View leads directly in Google Sheets
- **Real-time Updates**: Data syncs automatically
- **Backup**: In-memory storage as fallback
- **Export**: Easy to export data for analysis

## 📋 Prerequisites

1. **Google Account**: You need a Google account
2. **Google Cloud Project**: Create a new project in Google Cloud Console
3. **Google Sheets API**: Enable the Google Sheets API

## 🚀 Setup Steps

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "AI Lead Capture")
4. Click "Create"

### Step 2: Enable Google Sheets API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Sheets API"
3. Click on it and click "Enable"

### Step 3: Create Service Account

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "Service Account"
3. Fill in the details:
   - **Name**: `ai-lead-capture-sheets`
   - **Description**: `Service account for AI Lead Capture Google Sheets integration`
4. Click "Create and Continue"
5. Skip the optional steps and click "Done"

### Step 4: Generate Service Account Key

1. Click on your service account name
2. Go to "Keys" tab
3. Click "Add Key" → "Create New Key"
4. Choose "JSON" format
5. Click "Create" (this will download a JSON file)

### Step 5: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "AI Lead Capture Data"
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

### Step 6: Share the Sheet

1. In your Google Sheet, click "Share"
2. Add your service account email (found in the JSON file)
3. Give it "Editor" permissions
4. Click "Send"

### Step 7: Set Environment Variables

In your Vercel project settings, add these environment variables:

```
GOOGLE_SHEET_ID=your_spreadsheet_id_here
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}
```

**Important**: For the `GOOGLE_SERVICE_ACCOUNT_KEY`, paste the entire JSON content from the downloaded file.

## 📊 Sheet Structure

The system will automatically create these sheets:

### Leads Sheet
| Column | Description |
|--------|-------------|
| A | Lead ID |
| B | Phone Number |
| C | Name |
| D | Call SID |
| E | Status |
| F | Created At |

### Responses Sheet
| Column | Description |
|--------|-------------|
| A | Lead ID |
| B | Question ID |
| C | Question Text |
| D | Answer |
| E | Confidence |
| F | Created At |

### Questions Sheet
| Column | Description |
|--------|-------------|
| A | ID |
| B | Question Text |
| C | Order |
| D | Active |

## 🔧 Testing the Integration

### 1. Check Health Endpoint
Visit: `https://your-app.vercel.app/api/health`

Look for:
```json
{
  "status": "ok",
  "google_sheets_configured": true
}
```

### 2. Test Lead Creation
1. Fill out the lead capture form
2. Check your Google Sheet
3. Verify the lead appears in the "Leads" sheet

### 3. Test Response Storage
1. Complete a call with questions
2. Check the "Responses" sheet
3. Verify responses are recorded

## 🛠️ Troubleshooting

### Common Issues

1. **"Google Sheets not configured"**
   - Check that `GOOGLE_SHEET_ID` is set
   - Verify `GOOGLE_SERVICE_ACCOUNT_KEY` is valid JSON

2. **"Permission denied"**
   - Make sure the service account has Editor access to the sheet
   - Check that the sheet ID is correct

3. **"API not enabled"**
   - Enable Google Sheets API in Google Cloud Console
   - Wait a few minutes for changes to propagate

4. **"Invalid credentials"**
   - Regenerate the service account key
   - Update the environment variable

### Debug Commands

Check the logs in Vercel for these messages:
- ✅ `Google Sheets initialized with service account`
- ✅ `Using Google Sheets for data storage`
- ✅ `Lead saved to Google Sheets`
- ✅ `Response saved to Google Sheets`

## 🔒 Security Notes

- Keep your service account key secure
- Don't commit the JSON file to version control
- Use environment variables in production
- Consider using Google Cloud IAM for additional security

## 📈 Data Management

### Viewing Data
- Open your Google Sheet to view all leads and responses
- Use Google Sheets filters and sorting
- Export data to CSV for analysis

### Backup
- The system maintains in-memory backup
- Google Sheets provides automatic versioning
- Consider setting up automated backups

### Cleanup
- Old leads are kept indefinitely
- You can manually delete rows in Google Sheets
- Consider adding a cleanup script for old data

## 🎉 Success!

Once configured, your AI Lead Capture System will:
- Store all leads in Google Sheets
- Record all question responses
- Provide persistent data storage
- Allow easy data export and analysis
- Maintain backup in memory

Your data will now be safely stored and easily accessible! 🚀
