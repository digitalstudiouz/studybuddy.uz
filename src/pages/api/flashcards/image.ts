import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const { keyword, language } = req.body;
  if (!keyword || !language) return res.status(400).json({ error: 'Missing keyword or language' });

  try {
    const prompt = `${keyword} (${language})`;
    const dalle = await openai.images.generate({
        prompt,
        n: 1,
        size: '512x512',
        response_format: 'url',
      });
      if (dalle.data && dalle.data[0] && dalle.data[0].url) {
        const image_url = dalle.data[0].url;
        res.status(200).json({ image_url });
      } else {
        throw new Error('No image URL returned from OpenAI');
      }
  } catch (e) {
    // Fallback to Unsplash
    try {
      const unsplash = await fetch(`https://api.unsplash.com/photos/random?query=${encodeURIComponent(keyword)}&client_id=${process.env.UNSPLASH_ACCESS_KEY}`);
      const data = await unsplash.json();
      if (data && data.urls && data.urls.regular) {
        res.status(200).json({ image_url: data.urls.regular });
        return;
      }
    } catch {}
    res.status(500).json({ error: 'Failed to generate image', details: e instanceof Error ? e.message : e });
  }
} 