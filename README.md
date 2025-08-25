# 🤖 AI Lead Capture System

An intelligent voice-based lead capture system that automatically calls leads and collects information through conversational AI.

## 🚀 Features

- **Automated Outbound Calling**: AI agent calls leads automatically when they submit the form
- **Conversational Question Flow**: Asks a series of predefined questions to gather lead information
- **Speech Recognition**: Uses Twilio's speech-to-text to understand lead responses
- **Data Storage**: Stores all lead responses in SQLite database
- **Admin Dashboard**: Beautiful interface to view and manage leads
- **Real-time Updates**: Auto-refreshing dashboard with live data

## 📋 Default Questions

The system asks leads the following questions in order:

1. What is your name?
2. What is your email address?
3. What is your company name?
4. What is your job title?
5. What is your primary business need?
6. What is your budget range for this project?
7. When do you need this completed?
8. How did you hear about us?

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- Twilio Account with:
  - Account SID
  - Auth Token
  - Phone Number
- ngrok (for local development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd ai-node-git
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   TWILIO_ACCOUNT_SID=your_twilio_account_sid
   TWILIO_AUTH_TOKEN=your_twilio_auth_token
   TWILIO_PHONE_NUMBER=your_twilio_phone_number
   APP_BASE_URL=https://your-ngrok-url.ngrok-free.app
   PORT=3000
   ```

4. **Start the development server**
   ```bash
   # Start ngrok (in a separate terminal)
   ./start-ngrok.sh
   
   # Or manually:
   ngrok http 3000
   
   # Start the server
   npm run dev
   ```

## 📱 Usage

### For Leads

1. Visit the main page at `http://localhost:3000`
2. Fill in your name and phone number
3. Click "Start AI Call"
4. The AI will call you and ask questions
5. Answer each question verbally
6. Your responses will be stored automatically

### For Administrators

1. Visit the admin dashboard at `http://localhost:3000/admin`
2. View all leads and their responses
3. Click on any lead to see their detailed responses
4. Monitor real-time statistics

## 🗄️ Database Schema

### Tables

- **leads**: Stores lead information (ID, phone, name, call SID, etc.)
- **questions**: Stores the questions to ask leads
- **responses**: Stores lead responses with confidence scores

### API Endpoints

- `GET /api/leads` - Get all leads
- `GET /api/leads/:leadId` - Get specific lead with responses
- `POST /api/call-user` - Initiate a call to a lead

## 🔧 Customization

### Adding New Questions

To add or modify questions, you can:

1. **Edit the database directly**:
   ```sql
   INSERT INTO questions (question_text, question_order) 
   VALUES ('Your new question?', 9);
   ```

2. **Modify the default questions** in `database.js`:
   ```javascript
   const defaultQuestions = [
     // ... existing questions
     { text: "Your new question?", order: 9 }
   ];
   ```

### Customizing the AI Voice

You can modify the voice responses in `server.js`:

```javascript
// In the /voice endpoint
twiml.say("Your custom greeting message");

// In the /voice/question endpoint
gather.say(`Your custom question format: ${currentQuestion.question_text}`);
```

## 🚀 Deployment

### Vercel Deployment

1. **Update webhook URLs** in `api/voice.js`:
   ```javascript
   url: "https://your-vercel-app.vercel.app/api/voice"
   ```

2. **Set environment variables** in Vercel dashboard

3. **Deploy using Vercel CLI**:
   ```bash
   vercel --prod
   ```

### Other Platforms

The system can be deployed to any Node.js hosting platform:
- Heroku
- DigitalOcean App Platform
- AWS Lambda
- Google Cloud Functions

## 📊 Monitoring

### Logs

Monitor the application logs for:
- Call initiation status
- Speech recognition results
- Database operations
- Error messages

### Twilio Console

Check the Twilio console for:
- Call logs and recordings
- Speech recognition accuracy
- Webhook delivery status

## 🔒 Security Considerations

- Store Twilio credentials securely
- Validate phone numbers before calling
- Implement rate limiting for call initiation
- Secure the admin dashboard in production
- Use HTTPS for all webhook endpoints

## 🐛 Troubleshooting

### Common Issues

1. **Calls not connecting**
   - Check Twilio credentials
   - Verify phone number format (E.164)
   - Ensure webhook URLs are accessible

2. **Speech not recognized**
   - Check audio quality
   - Verify Twilio speech recognition settings
   - Review confidence scores in responses

3. **Database errors**
   - Check file permissions for SQLite
   - Verify database path
   - Review error logs

### Debug Mode

Enable debug logging by setting:
```javascript
console.log('Debug info:', data);
```

## 📈 Analytics

The system provides:
- Total leads captured
- Daily lead count
- Average responses per lead
- Speech recognition confidence scores
- Call completion rates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the troubleshooting section
- Review Twilio documentation
- Open an issue on GitHub

---

**Built with ❤️ using Node.js, Express, Twilio, and SQLite**
