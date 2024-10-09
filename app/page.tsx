/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ prompt: string; response: string }[]>([]);

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file) {
      setVideoFile(file);
      setVideoURL(URL.createObjectURL(file));
    } else {
      setVideoURL(null);
    }
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setTextPrompt(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!videoFile || !textPrompt) {
      alert('Please upload a video and enter a prompt');
      return;
    }

    setIsSubmitting(true);
    setResponseMessage(null);

    // Create a FormData object to hold the video and text parts
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('prompt', textPrompt); // Append the text prompt

    try {
      const response = await fetch('/api/analyze-video', { // Update the endpoint
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Update chat messages with the prompt and response from the server
        setChatMessages((prevMessages) => [
          ...prevMessages,
          { prompt: textPrompt, response: result.message },
        ]);
        setTextPrompt('');
      } else {
        setResponseMessage('Submission failed: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error submitting data', error);
      setResponseMessage('Error submitting data: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Left Side - Video Upload and Preview */}
      <div className="flex-1 p-8 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-center">Upload a Video</h1>
        <form className="flex-1 flex flex-col justify-center">
          <div className="mb-4">
            <label htmlFor="video" className="block text-sm font-medium text-gray-700">Video Upload:</label>
            <input
              type="file"
              id="video"
              accept="video/*"
              onChange={handleVideoChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          {videoURL && (
            <div className="mt-6">
              <h2 className="text-xl font-bold mb-2">Preview:</h2>
              <video controls src={videoURL} className="w-full rounded-md shadow-sm" />
            </div>
          )}
        </form>
      </div>

      {/* Right Side - LLM-like Chat Interface */}
      <div className="flex-1 p-8 border-l border-gray-300 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-center">Chat Interface</h1>
        <div className="bg-white p-4 rounded shadow-md flex-1 flex flex-col-reverse">
          <div className="flex-1 overflow-y-auto max-h-[500px]" ref={(el) => {
            if (el) {
              el.scrollTop = el.scrollHeight;
            }
          }}>
            <div className="flex flex-col">
              <div className="bg-indigo-100 p-2 rounded-md flex flex-col flex-grow">Hi! How can I assist you?</div>
              {chatMessages.map((msg, index) => (
                <div key={index} className="">
                  <div className="bg-gray-200 p-2 mb-2 mt-2 ml-4 rounded-md">You: {msg.prompt}</div>
                  <div className="bg-indigo-100 p-2 rounded-md mr-4">Response: {msg.response}</div>
                </div>
              ))}
              {responseMessage && (
                <div className="bg-indigo-100 p-2 rounded-md flex-grow">{responseMessage}</div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <input
            type="text"
            value={textPrompt}
            onChange={handleTextChange}
            onKeyPress={(event) => {
              if (event.key === 'Enter') {
                handleSubmit(event);
              }
            }}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
          />
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-r-md shadow-sm text-sm font-medium text-white ${isSubmitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10`}
          >
            {isSubmitting ? '...' : <SendHorizontal />}
          </button>
        </div>
      </div>
    </div>
  );
}
