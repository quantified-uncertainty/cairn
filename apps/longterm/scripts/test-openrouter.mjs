import dotenv from 'dotenv';
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
console.log('API Key loaded:', OPENROUTER_API_KEY ? 'Yes (length: ' + OPENROUTER_API_KEY.length + ')' : 'No');

const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'https://cairn-wiki.vercel.app'
  },
  body: JSON.stringify({
    model: 'perplexity/sonar',
    messages: [{
      role: 'user',
      content: 'What is X Community Notes (formerly Birdwatch)? Give me key facts, statistics, and academic research about its effectiveness.'
    }],
    max_tokens: 1000
  })
});

const data = await response.json();
if (data.error) {
  console.error('Error:', data.error);
} else {
  console.log('Model:', data.model);
  console.log('Usage:', data.usage);
  console.log('\nResponse:\n', data.choices[0].message.content);
}
