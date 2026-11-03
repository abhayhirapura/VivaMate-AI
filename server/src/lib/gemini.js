
import { GoogleGenAI } from '@google/genai';
import { AI_TIMEOUT_MS, AI_RETRIES } from '../config/adaptiveConfig.js';

const apiKey = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL;
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL;

if (!apiKey) throw new Error('GEMINI_API_KEY is missing in server/.env');
if (!MODEL) throw new Error('GEMINI_MODEL is missing in server/.env');

const ai = new GoogleGenAI({ apiKey });
const TIMEOUT = AI_TIMEOUT_MS || 30000;
const RETRIES = AI_RETRIES ?? 2;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function isTemporaryError(error) {
  const message = String(error?.message || '').toLowerCase();
  const status = Number(error?.status || error?.code);

  return [429, 500, 502, 503, 504].includes(status) ||
    ['unavailable', 'high demand', 'resource_exhausted', 'timeout', 'network']
      .some(term => message.includes(term));
}

async function callWithTimeout(fn) {
  let timer;
  try {
    return await Promise.race([
      fn(),
      new Promise((_, reject) => {
        timer = setTimeout(
          () => reject(new Error('Gemini request timed out')),
          TIMEOUT
        );
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function requestWithRetry(model, contents, generationConfig) {
  let lastError;

  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    try {
      return await callWithTimeout(() =>
        ai.models.generateContent({ model, contents, generationConfig })
      );
    } catch (error) {
      lastError = error;
      if (!isTemporaryError(error) || attempt === RETRIES) throw error;
      await sleep(Math.min(1000 * (2 ** attempt), 8000));
    }
  }

  throw lastError;
}

async function generate(contents, generationConfig) {
  try {
    return await requestWithRetry(MODEL, contents, generationConfig);
  } catch (error) {
    if (FALLBACK_MODEL && FALLBACK_MODEL !== MODEL && isTemporaryError(error)) {
      console.warn('Trying fallback Gemini model...');
      return requestWithRetry(FALLBACK_MODEL, contents, generationConfig);
    }
    throw error;
  }
}

export async function generateContent(contents, generationConfig = {}) {
  const response = await generate(contents, generationConfig);
  return response.text;
}

export async function generateJSON(contents, schema, retries = RETRIES) {
  const response = await generate(contents, {
    temperature: 0.2,
    responseMimeType: 'application/json',
    responseSchema: schema
  });

  const rawText = response.text?.trim() || '';

  console.log('GEMINI RAW RESPONSE:', rawText);
  console.log('GEMINI FINISH REASON:', response.candidates?.[0]?.finishReason);

  const cleanedText = rawText
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  try {
    return JSON.parse(cleanedText);
  } catch (error) {
    console.error('JSON PARSE ERROR:', error.message);
    throw new Error('Gemini returned invalid JSON. Please retry.');
  }
}
