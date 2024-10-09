// app/api/upload/route.ts
import { NextResponse } from 'next/server';
// import { VertexAI } from '@google-cloud/vertexai';

export async function POST(request: Request) {
  const formData = await request.formData();
  const prompt = formData.get('prompt');
  const videoFile = formData.get('video');
  console.log(videoFile, prompt);
//   const projectId = process.env.GEMINI_PROJ_ID; // Read project ID from environment variables

  // Here you would typically handle the video file,
  // for example, by saving it to a storage solution.

  // Mock response to simulate success
  const mockResponse = {
    message: `Video received with prompt: "${prompt}"`,
  };

  return NextResponse.json(mockResponse, { status: 200 });
}
