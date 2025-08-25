# 📊 Google Apps Script Integration Setup

This guide will help you set up Google Apps Script integration to store your lead data in Google Sheets. This approach is much simpler than the Google Sheets API!

## 🎯 Benefits

- **Easy Setup**: No complex API credentials needed
- **Free**: Google Apps Script is free to use
- **Secure**: Runs on Google's servers
- **Real-time**: Data syncs immediately
- **No Dependencies**: No additional npm packages needed
- **Backup**: In-memory storage as fallback

## 📋 Prerequisites

1. **Google Account**: You need a Google account
2. **Google Sheet**: Create a new Google Sheet for your data

## 🚀 Setup Steps

### Step 1: Create Google Sheet

1. Go to [Google Sheets](https://sheets.google.com/)
2. Create a new spreadsheet
3. Name it "AI Lead Capture Data"
4. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
   ```

### Step 2: Create Google Apps Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Click "New Project"
3. Name it "AI Lead Capture Script"
4. Delete the default code and paste the code from `google-apps-script-code.gs`
5. **Important**: Replace `YOUR_GOOGLE_SHEET_ID_HERE` with your actual sheet ID

### Step 3: Deploy as Web App

1. Click "Deploy" → "New deployment"
2. Choose "Web app" as the type
3. Set the following:
   - **Execute as**: "Me"
   - **Who has access**: "Anyone"
4. Click "Deploy"
5. Copy the Web App URL (you'll need this for the environment variable)

### Step 4: Initialize the Spreadsheet

1. In the Apps Script editor, run the `initializeSpreadsheet` function
2. This will create the required sheets and insert default questions
3. Check your Google Sheet to verify the sheets were created

### Step 5: Set Environment Variables

In your Vercel project settings, add these environment variables:

```
GOOGLE_SHEET_ID=your_spreadsheet_id_here
GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

## 📊 Sheet Structure

The system will automatically create these sheets:

### Leads Sheet
| Column | Description |
|--------|-------------|
| A | ID |
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

### 1. Test the Web App
Visit your Web App URL with `?action=test`:
```
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?action=test
```

You should see:
```json
{"message":"Google Apps Script is working!"}
```

### 2. Check Health Endpoint
Visit: `https://your-app.vercel.app/api/health`

Look for:
```json
{
  "status": "ok",
  "google_apps_script_configured": true
}
```

### 3. Test Lead Creation
1. Fill out the lead capture form
2. Check your Google Sheet
3. Verify the lead appears in the "Leads" sheet

### 4. Test Response Storage
1. Complete a call with questions
2. Check the "Responses" sheet
3. Verify responses are recorded

## 🛠️ Troubleshooting

### Common Issues

1. **"Google Apps Script not configured"**
   - Check that `GOOGLE_SHEET_ID` is set
   - Verify `GOOGLE_APPS_SCRIPT_URL` is correct

2. **"Permission denied"**
   - Make sure the Web App is deployed with "Anyone" access
   - Check that the sheet ID is correct

3. **"Invalid action"**
   - Verify the Web App URL is correct
   - Check that the Apps Script code is properly deployed

4. **"Sheet not found"**
   - Run the `initializeSpreadsheet` function in Apps Script
   - Check that the sheet ID is correct

### Debug Commands

Check the logs in Vercel for these messages:
- ✅ `Google Apps Script initialized successfully`
- ✅ `Using Google Apps Script for data storage`
- ✅ `Lead saved via Google Apps Script`
- ✅ `Response saved via Google Apps Script`

## 🔒 Security Notes

- The Web App URL is public but secure
- Only your Apps Script can access your sheet
- No API keys or credentials needed
- Google handles authentication automatically

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

## 🔄 Updating Questions

To modify the questions:

1. Edit the `DEFAULT_QUESTIONS` array in the Apps Script code
2. Redeploy the Web App
3. Run `initializeSpreadsheet` again to update the Questions sheet

## 🎉 Success!

Once configured, your AI Lead Capture System will:
- Store all leads in Google Sheets via Apps Script
- Record all question responses
- Provide persistent data storage
- Allow easy data export and analysis
- Maintain backup in memory

Your data will now be safely stored and easily accessible! 🚀

## 📝 Quick Reference

**Environment Variables:**
```
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_APPS_SCRIPT_URL=your_web_app_url
```

**Test URLs:**
- Web App Test: `YOUR_WEB_APP_URL?action=test`
- Health Check: `https://your-app.vercel.app/api/health`
- Get All Leads: `YOUR_WEB_APP_URL?action=getAllLeads`
- Get Questions: `YOUR_WEB_APP_URL?action=getQuestions`

**Apps Script Functions:**
- `initializeSpreadsheet()` - Set up sheets and questions
- `doGet(e)` - Handle GET requests
- `doPost(e)` - Handle POST requests
