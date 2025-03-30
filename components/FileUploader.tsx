'use client';

import { HiOutlineDocumentArrowUp } from "react-icons/hi2";
import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}



const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      setTimeout(() => setError(null), 3000);
    }
  }, [error]);

 

  const handleFileUpload = (file: File) => {
    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      toast.error("❌ Only PDF files are allowed!");
      return;
    }

    onFileUpload(file);
    setFileName(file.name);
    setError(null);
    toast.success("✅ File uploaded successfully!");
  };

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] }, 
    maxSize: 5 * 1024 * 1024, // 5MB limit
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        setError("Only PDF files under 5MB are allowed.");
        toast.error("⚠️ Only PDF files under 5MB are allowed!");
        return;
      }
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles[0]);
      }
    },
  });

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      handleFileUpload(event.target.files[0]);
    }
  };

  return (
    <div className="w-full flex flex-col justify-between p-4">
      
      {/* Toast Notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar />

      {/* Header Section */}
      <div className="mt-4 mb-8">
        <h1 className="md:text-[60px] text-[30px] md:max-w-[85%] w-full mx-auto text-amber-700 font-extrabold text-center mb-4">
          The better-packed alternative to <span className="text-black">Adobe Acrobat</span>
        </h1>
      </div>

      {/* Drag & Drop Area */}
      <div 
        {...getRootProps()} 
        className="rounded-md mx-auto p-3 flex flex-col items-center md:h-[350px] w-full bg-white text-center cursor-pointer border-2 border-dashed border-slate-800"
        role="button"
        aria-label="Upload a PDF file"
      >
        <HiOutlineDocumentArrowUp className="mt-4 mb-4 text-[50px]" />
        <input {...getInputProps()} />
        <p className="text-gray-700 md:text-[18px] text-[15px]">
          {fileName ? `File selected: ${fileName}` : 'Drop document here to Upload'}
        </p>
        <p className="text-[18px] font-bold text-gray-800 pt-2">OR</p>

        {/* File Input Button */}
        <div className="mt-4 text-center w-full">
          <input 
            type="file" 
            accept="application/pdf" 
            onChange={handleFileInputChange} 
            className="hidden" 
            id="fileUpload"
          />
          <label 
            htmlFor="fileUpload" 
            className="block md:w-1/3 w-full mx-auto px-6 py-3 bg-amber-600 text-white rounded-md cursor-pointer text-center hover:bg-amber-700 transition duration-200"
          >
            Select from Device
          </label>
        </div>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      <ToastContainer/>
    </div>
   
  );
};

export default FileUploader;
