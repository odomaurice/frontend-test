'use client';
import { MdEditDocument } from "react-icons/md";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onFileUpload: (file: File) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUpload }) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] }, 
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        onFileUpload(file);
        setFileName(file.name);
      }
    },
  });

  return (
    <div>
      <div {...getRootProps()} className="border-dashed rounded-md mx-auto md:w-[500px] flex flex-col items-center  h-[300px] w-full border-2 border-blue-300 p-8 text-center cursor-pointer">
        <input {...getInputProps()} />
        <p>{fileName ? `File selected: ${fileName}` : 'Drag & drop a PDF file here or click to select'}</p>
        <MdEditDocument className="mt-16 text-[50px]" />
      </div>
    </div>
  );
};

export default FileUploader;
