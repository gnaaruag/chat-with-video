import { NextApiRequest, NextApiResponse } from 'next';

interface ChatRequest extends NextApiRequest {
  body: {
    message: string;
  };
}

export default async function handler(req: ChatRequest, res: NextApiResponse) {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'No message provided' });
  }

  // Call the LLM API (OpenAI, Hugging Face, etc.)
  const response = await fetch('https://api.openai.com/v1/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer YOUR_OPENAI_API_KEY`,
    },
    body: JSON.stringify({
      model: 'gpt-4',
      prompt: `User is asking: ${message}. Provide a response based on the content of the video.`,
      max_tokens: 150,
    }),
  });

  const data = await response.json();

  res.status(200).json({ response: data.choices[0].text });
}
