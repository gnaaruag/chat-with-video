import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const apiKey: string = process.env.API_KEY!;

const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: Request) {
  const formData = await req.formData() as FormData;

  const videoUri = formData.get('videoUri') as string | null; // Accepting URI instead of file
  const textPrompt = formData.get('prompt') as string | null;
  console.log(videoUri)
  if (!videoUri || !textPrompt) {
    return NextResponse.json({ message: 'Video URI and prompt are required.' }, { status: 400 });
  }

  try {
    // Step 1: Generate content using the provided video URI and text prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'video/mp4',
          fileUri: videoUri, // Use the provided URI
        },
      },
      { text: textPrompt },
    ]);

    return NextResponse.json({ message: result.response.text() });

  } catch (error: unknown) {
    console.error('Error generating content:', error);
    return NextResponse.json({ message: 'Error generating content.' }, { status: 500 });
  }
}
