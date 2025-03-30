'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import PDFViewer from '@/components/PDFViewer';

const PDFAnnotationApp = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return (
    <div className="container flex flex-col justify-evenly  my-12  mx-auto p-4">
      
      <div>
      {!pdfFile ? (
        <FileUploader  onFileUpload={(file) => setPdfFile(file)} />
      ) : (
        <PDFViewer file={pdfFile}  />
      )}

      </div>
     
     
    </div>
  );
};

export default PDFAnnotationApp;
