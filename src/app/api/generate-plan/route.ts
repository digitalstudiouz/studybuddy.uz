import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
  });

interface Topic {
  title: string;
  goal: string;
  startDate: string;
  endDate: string;
  dailyTimeMinutes: number;
}

export async function POST(request: Request) {
  try {
    const { topics } = await request.json();

    if (!topics || !Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'No topics provided' },
        { status: 400 }
      );
    }

    const prompt = `Create a detailed study plan based on the following topics and constraints:

${(topics as Topic[])
  .map(
    (topic) => `
Topic: ${topic.title}
Goal: ${topic.goal}
Time Period: ${topic.startDate} to ${topic.endDate}
Daily Study Time: ${topic.dailyTimeMinutes} minutes
`
  )
  .join('\n')}

Please create a day-by-day study plan that:
1. Breaks down each topic into manageable chunks
2. Considers the daily time constraints
3. Includes specific tasks and goals for each day
4. Provides a balanced distribution of topics
5. Includes review sessions

Format the response as a JSON array of objects with the following structure:
{
  "plan": [
    {
      "date": "YYYY-MM-DD",
      "task": "Detailed task description",
      "topic": "Topic name",
      "duration": "Duration in minutes"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-3-haiku',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional study planner. Create detailed, practical study plans that help students achieve their goals efficiently. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error('No response from GPT-4');
    }

    let plan;
    try {
      plan = JSON.parse(response);
    } catch {
      console.error('Failed to parse GPT-4 response:', response);
      throw new Error('Invalid response format from GPT-4');
    }

    if (!plan.plan || !Array.isArray(plan.plan)) {
      throw new Error('Invalid plan format in GPT-4 response');
    }

    return NextResponse.json({ plan: plan.plan });
  } catch (error) {
    console.error('Error generating study plan:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate study plan',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 