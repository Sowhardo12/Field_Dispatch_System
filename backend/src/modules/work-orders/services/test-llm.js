// test-llm.js
const Groq = require('groq-sdk');
require('dotenv').config();

async function testLLMCall() {
  console.log('🚀 Testing GROQ API Call...\n');

  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    console.error('❌ GROQ_API_KEY not found in .env file!');
    console.log('Please add: GROQ_API_KEY=your_api_key_here to your .env file');
    process.exit(1);
  }

  console.log('✅ API Key found');

  try {
    const groq = new Groq({ apiKey });

    console.log('📡 Sending test request...\n');

    const response = await groq.chat.completions.create({
      messages: [
        { 
          role: 'user', 
          content: 'Respond with exactly one word: "electrician"' 
        }
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.1,
      max_tokens: 10,
    });

    console.log('✅ API Response:', response.choices[0]?.message?.content);
    console.log('📊 Token Usage:', response.usage);
    console.log('\n✨ API call successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status) {
      console.error('Status:', error.status);
    }
    process.exit(1);
  }
}

// Run the test
testLLMCall();