# 🚀 Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be in a GitHub repository
3. **Twilio Account**: With Account SID, Auth Token, and Phone Number

## Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your GitHub repository
4. Select the repository containing this AI Lead Capture System

### 2. Configure Environment Variables

In your Vercel project settings, add these environment variables:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
NODE_ENV=production
```

### 3. Deploy

1. Vercel will automatically detect the Node.js project
2. Click "Deploy"
3. Wait for the deployment to complete

### 4. Configure Twilio Webhooks

After deployment, update your Twilio webhook URLs:

1. Go to your Twilio Console
2. Navigate to Phone Numbers → Manage → Active numbers
3. Click on your phone number
4. Set the webhook URL for incoming calls to:
   ```
   https://your-vercel-app.vercel.app/voice
   ```

## Important Notes

### Database Storage
- This deployment uses in-memory storage (data is lost on server restart)
- For production use, consider integrating with:
  - MongoDB Atlas
  - PostgreSQL (Supabase, Railway)
  - Firebase Firestore

### Environment Variables
Make sure all Twilio credentials are properly set in Vercel:
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token  
- `TWILIO_PHONE_NUMBER`: Your Twilio phone number in E.164 format

### Testing
1. Visit your deployed app: `https://your-app.vercel.app`
2. Fill out the lead capture form
3. Check the admin dashboard: `https://your-app.vercel.app/admin`
4. Test the health endpoint: `https://your-app.vercel.app/api/health`

## Troubleshooting

### Common Issues

1. **"Twilio is not configured" error**
   - Check that all environment variables are set in Vercel
   - Verify the variable names are correct

2. **Calls not connecting**
   - Ensure Twilio webhook URLs are updated
   - Check Twilio console for call logs

3. **Database not persisting**
   - This is expected with in-memory storage
   - Consider adding a persistent database

### Debug Mode

Add this environment variable for debugging:
```
DEBUG=true
```

## Production Considerations

1. **Database**: Replace in-memory storage with a persistent database
2. **Security**: Add authentication to admin dashboard
3. **Monitoring**: Set up logging and monitoring
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **SSL**: Vercel provides SSL automatically

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test with the health endpoint
4. Check Twilio console for call status
