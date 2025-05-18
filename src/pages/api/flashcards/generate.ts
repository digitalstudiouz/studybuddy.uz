import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY!,
  baseURL: "https://openrouter.ai/api/v1", // кастомный эндпоинт
  defaultHeaders: {
    "HTTP-Referer": "your-app-name.onrender.com", // как указано в OpenRouter
    "X-Title": "Your App Name",
  },
});
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { topic, language } = req.body;
  if (!topic || !language) return res.status(400).json({ error: 'Missing topic or language' });

  try {
    const prompt = `Generate 5 flashcards on the topic "${topic}" in ${language}. Format as JSON array: [{"question": "...", "answer": "..."}]`;
    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku',
        messages: [
            { role: 'system', content: 'You are a helpful assistant for students.' },
            { role: 'user', content: prompt },
          ],
        temperature: 0.7,
        max_tokens: 800,
      });
      const text = completion.choices[0].message?.content || '[]';
    const cards = JSON.parse(text);
    res.status(200).json({ cards });
  } catch (e) {
    res.status(500).json({ error: 'Failed to generate flashcards', details: e instanceof Error ? e.message : e });
  }
} 