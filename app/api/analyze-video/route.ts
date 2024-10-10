// app/api/analyze-video/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager, FileState } from '@google/generative-ai/server';
import dotenv from 'dotenv';
import AWS from 'aws-sdk';

dotenv.config();
const apiKey: string = process.env.API_KEY!;

const genAI = new GoogleGenerativeAI(apiKey);
const fileManager = new GoogleAIFileManager(apiKey);


export async function POST(req: Request) {
  const formData = await req.formData() as FormData;  

  const videoFile = formData.get('video') as File | null; // Explicitly set the type
  const textPrompt = formData.get('prompt') as string | null;

  const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });

  const uploadToS3 = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const params = {
      Bucket: process.env.AWS_S3_BUCKET_NAME!,
      Key: `${Date.now()}_${file.name}`,
      Body: Buffer.from(buffer),
      ContentType: file.type,
    };

    const data = await s3.upload(params).promise();
    return data.Location;
  };

  const s3Uri = await uploadToS3(videoFile!);

  if (!videoFile || !textPrompt) {
    return NextResponse.json({ message: 'Video file and prompt are required.' }, { status: 400 });
  }

  // Upload the video file using GoogleAIFileManager
  try {
    // Extract the S3 URI path
    const s3UriPath = s3Uri.substring(s3Uri.indexOf('https://'));
    console.log(s3UriPath);
  
    // Step 1: Download the file from S3 using fetch
    const s3FileResponse = await fetch(s3UriPath);
    if (!s3FileResponse.ok) {
      throw new Error(`Failed to download file from S3: ${s3FileResponse.statusText}`);
    }
  
    const fileBuffer = await s3FileResponse.arrayBuffer();
  
    // Step 2: Save the file locally
    const localTmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(localTmpDir)) {
      fs.mkdirSync(localTmpDir);
    }
    const localFilePath = path.join(localTmpDir, 'downloaded-video.mp4');
    fs.writeFileSync(localFilePath, Buffer.from(fileBuffer));
  
    // Step 3: Upload the file using the local file path
    const uploadResult = await fileManager.uploadFile(
      localFilePath,
      {
        mimeType: 'video/mp4',
        displayName: 'target',
      },
    );
  
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
  
    // Step 4: Use the URI of the uploaded video file for further processing
    const fileUri = uploadResult.file.uri;
    console.log('File URI:', fileUri);
  
    // Generate content using the uploaded file and text prompt
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
