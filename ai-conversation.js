const OpenAI = require('openai');

class AIConversationService {
  constructor() {
    this.openai = null;
    this.conversationHistory = new Map(); // Store conversation context per lead
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      console.log('✅ OpenAI initialized successfully');
    } else {
      console.log('⚠️ OpenAI API key not found. AI features will be disabled.');
    }
  }

  // Generate initial greeting based on lead info
  async generateGreeting(leadName, company = null) {
    if (!this.openai) {
      return `Hello ${leadName || 'there'}. I'm your AI assistant. I have a few questions to better understand your needs. Let's get started.`;
    }

    try {
      const prompt = `Generate a friendly, professional greeting for a sales call. 
      Lead name: ${leadName || 'Prospect'}
      Company: ${company || 'Not specified'}
      
      Keep it under 2 sentences and make it sound natural and conversational.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a friendly, professional AI sales assistant. Keep responses concise and natural."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating greeting:', error);
      return `Hello ${leadName || 'there'}. I'm your AI assistant. I have a few questions to better understand your needs. Let's get started.`;
    }
  }

  // Generate dynamic follow-up questions based on previous answers
  async generateFollowUpQuestion(leadId, previousAnswers, currentQuestionIndex) {
    if (!this.openai) {
      return null; // Use static questions
    }

    try {
      // Get conversation history
      const history = this.conversationHistory.get(leadId) || [];
      
      const prompt = `Based on the conversation history below, generate a relevant follow-up question that would help qualify this lead better.

      Conversation History:
      ${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n')}

      Previous answers: ${JSON.stringify(previousAnswers)}

      Generate ONE follow-up question that:
      1. Is relevant to their previous answers
      2. Helps qualify them as a lead
      3. Is conversational and natural
      4. Can be answered in 1-2 sentences

      Question:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sales qualification AI. Generate relevant follow-up questions based on conversation context."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating follow-up question:', error);
      return null; // Fallback to static questions
    }
  }

  // Generate intelligent response to user's answer
  async generateResponseToAnswer(leadId, question, answer) {
    if (!this.openai) {
      return `Thank you. You said: ${answer}`;
    }

    try {
      // Update conversation history
      const history = this.conversationHistory.get(leadId) || [];
      history.push({ question, answer });
      this.conversationHistory.set(leadId, history);

      const prompt = `Generate a brief, natural response to acknowledge the user's answer and transition to the next question.

      Question: ${question}
      Answer: ${answer}

      Generate a response that:
      1. Acknowledges their answer
      2. Shows understanding
      3. Transitions smoothly to the next question
      4. Is under 2 sentences

      Response:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a conversational AI assistant. Keep responses brief and natural."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 100,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating response:', error);
      return `Thank you. You said: ${answer}`;
    }
  }

  // Generate closing message based on conversation
  async generateClosingMessage(leadId, allAnswers) {
    if (!this.openai) {
      return "Perfect! That was the last question. Thank you for your time. A team member will review your responses and contact you shortly. Have a great day!";
    }

    try {
      const history = this.conversationHistory.get(leadId) || [];
      
      const prompt = `Generate a personalized closing message for this sales call based on the conversation.

      Conversation Summary:
      ${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n')}

      Generate a closing message that:
      1. Thanks them for their time
      2. Mentions next steps
      3. Is personalized based on their answers
      4. Is professional and friendly
      5. Is under 3 sentences

      Closing message:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a professional sales assistant. Generate personalized closing messages."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating closing message:', error);
      return "Perfect! That was the last question. Thank you for your time. A team member will review your responses and contact you shortly. Have a great day!";
    }
  }

  // Analyze lead quality based on conversation
  async analyzeLeadQuality(leadId, allAnswers) {
    if (!this.openai) {
      return { quality: 'medium', score: 5, notes: 'AI analysis not available' };
    }

    try {
      const history = this.conversationHistory.get(leadId) || [];
      
      const prompt = `Analyze this sales conversation and provide a lead quality assessment.

      Conversation:
      ${history.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n')}

      Provide a JSON response with:
      - quality: "high", "medium", or "low"
      - score: 1-10 rating
      - notes: brief explanation of the assessment
      - nextSteps: recommended follow-up actions

      Response:`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a sales lead qualification expert. Analyze conversations and provide quality assessments."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      const analysis = JSON.parse(response.choices[0].message.content.trim());
      return analysis;
    } catch (error) {
      console.error('Error analyzing lead quality:', error);
      return { quality: 'medium', score: 5, notes: 'Analysis failed', nextSteps: 'Manual review recommended' };
    }
  }

  // Clear conversation history for a lead
  clearConversationHistory(leadId) {
    this.conversationHistory.delete(leadId);
  }
}

module.exports = new AIConversationService();
