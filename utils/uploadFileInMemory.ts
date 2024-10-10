/* eslint-disable @typescript-eslint/no-explicit-any */
export async function uploadFileInMemory(fileBuffer: Buffer | Uint8Array, fileMetadata: { mimeType: any; displayName: any; }) {
    const apiKey = process.env.API_KEY;
    const boundary = `----WebKitFormBoundary${Math.random().toString(16).slice(2)}`;
    const delimiter = `--${boundary}`;
    const closeDelimiter = `--${boundary}--`;
    // Metadata JSON part
    const metadata = {
      mimeType: fileMetadata.mimeType,
      displayName: fileMetadata.displayName,
    };
    const preamble = `${delimiter}\r\nContent-Type: application/json; charset=utf-8\r\n\r\n${JSON.stringify({ file: metadata })}\r\n${delimiter}\r\nContent-Type: ${fileMetadata.mimeType}\r\n\r\n`;
    const postamble = `\r\n${closeDelimiter}`;
    const multipartBody = Buffer.concat([
      Buffer.from(preamble),
      fileBuffer,
      Buffer.from(postamble),
    ]);
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files`;
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'x-goog-api-client': 'genai-js/0.21.0',
          'x-goog-api-key': apiKey || '',
          'X-Goog-Upload-Protocol': 'multipart',
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`Error uploading file: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error during file upload:", error);
      throw error;
    }
  }




