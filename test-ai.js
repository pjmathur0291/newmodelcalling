const aiService = require('./ai-conversation');

async function testAIService() {
  console.log('🤖 Testing AI Conversation Service...\n');

  // Test 1: Generate greeting
  console.log('1. Testing greeting generation...');
  const greeting = await aiService.generateGreeting('John Doe', 'TechCorp');
  console.log('Greeting:', greeting);
  console.log('');

  // Test 2: Generate response to answer
  console.log('2. Testing response generation...');
  const response = await aiService.generateResponseToAnswer('test-lead-123', 'What is your company name?', 'TechCorp Inc.');
  console.log('Response:', response);
  console.log('');

  // Test 3: Generate follow-up question
  console.log('3. Testing follow-up question generation...');
  const followUp = await aiService.generateFollowUpQuestion('test-lead-123', [
    { question: 'What is your company name?', answer: 'TechCorp Inc.' }
  ], 1);
  console.log('Follow-up question:', followUp);
  console.log('');

  // Test 4: Generate closing message
  console.log('4. Testing closing message generation...');
  const closing = await aiService.generateClosingMessage('test-lead-123', [
    { question: 'What is your company name?', answer: 'TechCorp Inc.' },
    { question: 'What is your budget?', answer: '$50,000' }
  ]);
  console.log('Closing message:', closing);
  console.log('');

  // Test 5: Analyze lead quality
  console.log('5. Testing lead quality analysis...');
  const analysis = await aiService.analyzeLeadQuality('test-lead-123', [
    { question: 'What is your company name?', answer: 'TechCorp Inc.' },
    { question: 'What is your budget?', answer: '$50,000' },
    { question: 'When do you need this?', answer: 'Next month' }
  ]);
  console.log('Lead analysis:', JSON.stringify(analysis, null, 2));
  console.log('');

  console.log('✅ AI service tests completed!');
}

testAIService().catch(console.error);
