// app/api/analyze-video/route.ts
import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import dotenv from 'dotenv';

dotenv.config();
const apiKey: string = process.env.API_KEY!;
console.log(apiKey);

// const apiKey: string = process.env.API_KEY as string; // Use environment variable for the API key
const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

// Define the structure of the request body for TypeScript
// interface VideoFormData {
//   video: File;
//   prompt: string;
// }

// Handle the form submission
export async function POST(req: Request) {
  const formData = await req.formData() as FormData; // Parse the form data from the request

  const videoFile = formData.get('video') as File | null; // Explicitly set the type
  const textPrompt = formData.get('prompt') as string | null;

  if (!videoFile || !textPrompt) {
    return NextResponse.json({ message: 'Video file and prompt are required.' }, { status: 400 });
  }

  // Upload the video file using GoogleAIFileManager
  try {
    const uploadResult = await fileManager.uploadFile(
		`C:\\Users\\GAURANG\\Desktop\\main\\dev\\chat-w-video\\target2.mp4`,
		{
		  mimeType: "video/mp4",
		  displayName: "target",
		},
	  );

    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      process.stdout.write(".");
      // Sleep for 10 seconds
      await new Promise<void>((resolve) => setTimeout(resolve, 10_000));
      // Fetch the file from the API again
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error("Video processing failed.");
    }

    // Use the URI of the uploaded video file for further processing
    const fileUri = uploadResult.file.uri;

    // Generate content using the uploaded file and text prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: videoFile.type,
          fileUri: fileUri,
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
