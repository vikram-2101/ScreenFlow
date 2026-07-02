import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { uploadScreenshot, getScreenshot } from '../api/screenshots';
import { CloudUpload } from 'lucide-react';

export default function UploadZone({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState(''); // '' | 'uploading' | 'processing' | 'done' | 'error'

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    const selectedFile = acceptedFiles[0];
    setFile(selectedFile);
    setStatus('uploading');
    setProgress(0);

    try {
      const result = await uploadScreenshot(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setProgress(percentCompleted);
      });

      setStatus('processing');

      // Poll until done
      const pollInterval = setInterval(async () => {
        try {
          const check = await getScreenshot(result.id);
          if (check.status === 'COMPLETED' || check.status === 'FAILED') {
            clearInterval(pollInterval);
            setStatus(check.status === 'COMPLETED' ? 'done' : 'error');
            if (check.status === 'COMPLETED' && onUploadSuccess) {
              onUploadSuccess();
            }
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 2000);

    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  }, [onUploadSuccess]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  return (
    <div 
      {...getRootProps()} 
      className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
        isDragActive 
          ? 'border-indigo-400 bg-indigo-50/50' 
          : 'border-indigo-200 bg-[#F9F9FC] hover:bg-indigo-50/30'
      }`}
    >
      <input {...getInputProps()} />
      
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm text-indigo-600 mb-2">
          <CloudUpload className="w-8 h-8" />
        </div>
        
        {status === '' && (
          <>
            <h3 className="text-lg font-bold text-gray-900">Upload a screenshot</h3>
            <p className="text-sm text-gray-500">Drag and drop or paste your screenshot here</p>
            <p className="text-xs text-gray-400 uppercase font-medium mt-1">PNG, JPG, JPEG up to 20MB</p>
            <button type="button" className="mt-6 px-8 py-2.5 bg-indigo-600 text-white font-medium rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
              Choose File
            </button>
          </>
        )}

        {status === 'uploading' && (
          <div className="w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Uploading {file?.name}...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">{progress}%</p>
          </div>
        )}

        {status === 'processing' && (
          <div className="w-full max-w-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Processing {file?.name}...</h3>
            <p className="text-sm text-indigo-600 animate-pulse">Running AI OCR & Classification</p>
          </div>
        )}

        {status === 'done' && (
          <div className="w-full max-w-sm">
            <h3 className="text-lg font-bold text-green-600 mb-1">Success!</h3>
            <p className="text-sm text-gray-500">Successfully processed {file?.name}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="w-full max-w-sm">
            <h3 className="text-lg font-bold text-red-600 mb-1">Upload Failed</h3>
            <p className="text-sm text-gray-500">Error processing {file?.name}. Please try again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
