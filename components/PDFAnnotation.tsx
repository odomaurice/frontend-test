'use client';

import { useState } from 'react';
import FileUploader from '@/components/FileUploader';
import PDFViewer from '@/components/PDFViewer';

const PDFAnnotationApp = () => {
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  return (
    <div className="container my-12  mx-auto p-4">
      <h1 className="text-2xl font-semibold text-center mb-4">Upload and Annotate PDF</h1>
      {!pdfFile ? (
        <FileUploader  onFileUpload={(file) => setPdfFile(file)} />
      ) : (
        <PDFViewer file={pdfFile}  />
      )}
    </div>
  );
};

export default PDFAnnotationApp;
