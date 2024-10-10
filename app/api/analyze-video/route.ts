import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import { uploadFileInMemory } from '@/utils/uploadFileInMemory';

dotenv.config();
const apiKey: string = process.env.API_KEY!;



const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);

export async function POST(req: Request) {
  const formData = await req.formData() as FormData;

  const videoFile = formData.get('video') as File | null; // Explicitly set the type
  const textPrompt = formData.get('prompt') as string | null;

  if (!videoFile || !textPrompt) {
    return NextResponse.json({ message: 'Video file and prompt are required.' }, { status: 400 });
  }

  try {
    // Step 1: Upload the video file using `uploadFileInMemory`
    const fileBuffer = Buffer.from(await videoFile.arrayBuffer());
    const fileMetadata = {
      mimeType: videoFile.type,
      displayName: videoFile.name,
    };

    const uploadResult = await uploadFileInMemory(fileBuffer, fileMetadata);

    // Wait for processing to complete
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      process.stdout.write('.');
      // Sleep for 10 seconds
      await new Promise<void>((resolve) => setTimeout(resolve, 10_000));
      // Fetch the file from the API again
      file = await fileManager.getFile(uploadResult.file.name);
    }

    if (file.state === FileState.FAILED) {
      throw new Error('Video processing failed.');
    }

    // Step 2: Use the URI of the uploaded video file for further processing
    const fileUri = uploadResult.file.uri;
    console.log('File URI:', fileUri);

    // Step 3: Generate content using the uploaded file and text prompt
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
    });

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: 'video/mp4',
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
