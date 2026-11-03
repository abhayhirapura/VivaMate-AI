
import { AI_TIMEOUT_MS } from '../config/adaptiveConfig.js';

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = process.env.GROQ_MODEL;

if (!API_KEY) throw new Error('GROQ_API_KEY is missing in server/.env');
if (!MODEL) throw new Error('GROQ_MODEL is missing in server/.env');

const TIMEOUT = AI_TIMEOUT_MS || 30000;

function toMessages(contents) {
  if (typeof contents === 'string') {
    return [{ role: 'user', content: contents }];
  }

  if (!Array.isArray(contents)) {
    contents = [contents];
  }

  return contents.map(item => {
    const role = item.role === 'model' ? 'assistant' :
      item.role === 'system' ? 'system' : 'user';

    const content = typeof item === 'string'
      ? item
      : item.parts?.map(part => part.text || '').join('\n') ||
      item.content || '';

    return { role, content };
  });
}

async function callGroq(contents, generationConfig = {}, schema = null) {
  const messages = toMessages(contents);

  if (schema) {
    messages.push({
      role: 'user',
      content:
        'Return valid JSON matching this schema. Do not include markdown:\n' +
        JSON.stringify(schema)
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: MODEL,
          messages,
          temperature: generationConfig.temperature ?? 0.2,
          max_tokens: 4096,
          ...(schema ? { response_format: { type: 'json_object' } } : {})
        }),
        signal: controller.signal
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const error = new Error(
        data.error?.message || `Groq API error: ${response.status}`
      );
      error.status = response.status;
      throw error;
    }

    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Groq request timed out. Please try again.');
    }
    console.error('Groq API error:', error.message);
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateContent(contents, generationConfig = {}) {
  return await callGroq(contents, generationConfig);
}

export async function generateJSON(contents, schema, retries = 2) {
  const rawText = await callGroq(contents, { temperature: 0.2 }, schema);

  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('JSON PARSE ERROR:', error.message);
    console.error('Groq response:', rawText);
    throw new Error('Groq returned invalid JSON. Please retry.');
  }
}
