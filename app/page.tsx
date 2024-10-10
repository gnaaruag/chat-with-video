/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { PulseLoader } from 'react-spinners';
export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isVideoSubmitting, setIsVideoSubmitting] = useState<boolean>(false); // Separate state for video submission
  const [isTextSubmitting, setIsTextSubmitting] = useState<boolean>(false); // Separate state for text submission
  const [responseMessage, setResponseMessage] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ prompt: string; response: string }[]>([]);
  const [fileUri, setFileUri] = useState<string | null>(null); // New state for file URI
  const [summary, setSummary] = useState<string | null>(null); // New state for summary

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

  const handleVideoSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!videoFile) {
      alert('Please upload a video before sending a message.');
      return;
    }
    setIsVideoSubmitting(true); // Set video submitting to true
    setResponseMessage(null);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setFileUri(result.fileUri);
        setSummary(result.message);
        console.log(summary);
        setResponseMessage('Video uploaded successfully.');
      } else {
        setResponseMessage('Upload failed: ' + result.message);
      }
    } catch (error: any) {
      console.error('Error uploading video', error);
      setResponseMessage('Error uploading video: ' + error.message);
    } finally {
      setIsVideoSubmitting(false); // Reset video submitting state
    }
  };

  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!fileUri) {
      alert('Please upload a video before sending a message.');
      return;
    }

    if (!textPrompt) {
      alert('Please enter a message.');
      return;
    }

    setIsTextSubmitting(true); // Set text submitting to true
    setResponseMessage(null);

    try {
      // Create a FormData object to hold the prompt and file URI
      const formData = new FormData();
  
      formData.append('videoUri', fileUri);
      formData.append('prompt', textPrompt);

      // Call the /api/analyze endpoint
      const response = await fetch('/api/analyze-video', {
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
      setIsTextSubmitting(false); // Reset text submitting state
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Left Side - Video Upload and Preview */}
      <div className="flex-1 p-8 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-left">Upload a Video</h1>
        <form className=" flex-start flex flex-col justify-center" onSubmit={handleVideoSubmit}>
          <div className="mb-4 border border-gray-300 rounded-md p-4">
            <label htmlFor="video" className="block text-sm font-medium text-gray-700">Video Upload:</label>
            <input
              type="file"
              id="video"
              accept="video/*"
              onChange={handleVideoChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            
            {videoURL && (
              <div className="mt-6 flex flex-col items-center">
                <h2 className="text-xl font-bold mb-2">Preview:</h2>
                <div className="w-full max-w-md h-64 rounded-md shadow-sm overflow-hidden">
                  <video controls src={videoURL} className="w-full h-full object-cover" />
                </div>
              </div>
            )}
            <div className="mt-4">
              <button
                type="submit"
                disabled={isVideoSubmitting}
                className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isVideoSubmitting ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
              >
                {isVideoSubmitting ? 'Uploading...' : 'Upload Video'}
              </button>
            </div>
          </div>
        </form>
        {summary && (
          <div className="mt-4 bg-white p-4 rounded shadow-md mb-4">
            <h2 className="text-lg font-semibold">Summary:</h2>
            <p>{summary}</p>
          </div>
        )}
      </div>

      {/* Right Side - Summary and Chat Interface */}
      <div className="flex-1 p-8 border-l border-gray-300 flex flex-col">
        <h1 className="text-2xl font-bold mb-6 text-left">Talk to your video</h1>
        <div className="bg-white flex-start p-4 rounded shadow-md  flex flex-col-reverse">
          <div className="flex-1 overflow-y-auto min-h-[550px] max-h-[550px]" ref={(el) => {
            if (el) {
              el.scrollTop = el.scrollHeight;
            }
          }}>
            <div className="flex flex-col">
              <div className=" p-2 rounded-md flex flex-col flex-grow">Start your conversation</div>
              {chatMessages.map((msg, index) => (
                <div key={index} className="mt-2">
                    <p className='text-right text-xs font-semibold mr-4 text-gray-500 '>YOU</p> 
                  <div className="bg-gray-200 p-2 mb-4 mt-2 ml-4 rounded-md">
                    {msg.prompt}</div>
                    <p className='text-left  text-xs font-semibold  ml-4 mb-1 text-gray-500'>RESPONSE</p> 
                  <div className="bg-indigo-100 p-2 rounded-md mr-4">{msg.response}</div>
                </div>
              ))}

            </div>
          </div>
        </div>

        <form className="mt-4 flex items-center gap-2" onSubmit={handleSubmit}>
          <input
            type="text"
            value={textPrompt}
            onChange={handleTextChange}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-10"
          />
          <button
            type="submit"
            disabled={isTextSubmitting || !fileUri} // Disable if text submitting or no fileUri
            className={`flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isTextSubmitting || !fileUri ? 'bg-gray-400' : 'bg-indigo-600 hover:bg-indigo-700'} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-10`}
          >
            {isTextSubmitting ? <PulseLoader size={6} color="#ffffff" /> : <SendHorizontal />}
          </button>
        </form>
      </div>
    </div>
  );
}
