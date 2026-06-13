let geminiClient = null;

async function getGeminiClient() {
  if (geminiClient) {
    return geminiClient;
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const error = new Error('Thiếu GEMINI_API_KEY hoặc GOOGLE_API_KEY');
    error.statusCode = 503;
    throw error;
  }

  const { GoogleGenAI } = await import('@google/genai');

  geminiClient = new GoogleGenAI({
    apiKey,
  });

  return geminiClient;
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
}

async function generateText({ contents, systemInstruction }) {
  const ai = await getGeminiClient();

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents,
    config: {
      systemInstruction,
    },
  });

  return response.text || '';
}

async function generateJson({ contents, systemInstruction, responseJsonSchema }) {
  const ai = await getGeminiClient();

  const response = await ai.models.generateContent({
    model: getGeminiModel(),
    contents,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseJsonSchema,
    },
  });

  return JSON.parse(response.text || '{}');
}

module.exports = {
  generateText,
  generateJson,
  getGeminiModel,
};
