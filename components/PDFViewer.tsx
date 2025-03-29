import React, { useState, useEffect, useRef } from "react";
import { PDFDocument, rgb } from "pdf-lib";

interface PDFViewerProps {
  file: File;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [annotationMode, setAnnotationMode] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#FF0000");

  const canvasRefs = useRef<HTMLCanvasElement | null>(null);
  const annotations = useRef<Record<number, Array<{ x: number; y: number; mode: string; color: string; text?: string; path?: { x: number; y: number } }>>>({});
  const isDrawing = useRef(false);
  const signaturePath = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    loadPdf(file);
  }, [file]);

  const loadPdf = async (file: File) => {
    const pdfBytes = await file.arrayBuffer();
    const loadedPdfDoc = await PDFDocument.load(pdfBytes);
    setPdfDoc(loadedPdfDoc);
    setNumPages(loadedPdfDoc.getPageCount());
    setCurrentPage(0);
    updatePdfPreview(loadedPdfDoc, 0);
  };

  const updatePdfPreview = async (doc: PDFDocument, pageIndex: number) => {
    const pages = doc.getPages();
    if (pages.length === 0) return;

    const newDoc = await PDFDocument.create();
    const copiedPage = await newDoc.copyPages(doc, [pageIndex]);
    newDoc.addPage(copiedPage[0]);

    const pdfBytes = await newDoc.save();
    const pdfBlob = new Blob([pdfBytes], { type: "application/pdf" });
    setPdfUrl(URL.createObjectURL(pdfBlob));

    setTimeout(() => adjustCanvasSize(), 500);
  };

  const adjustCanvasSize = () => {
    const iframe = document.getElementById("pdfIframe") as HTMLIFrameElement;
    if (!iframe || !canvasRefs.current) return;

    canvasRefs.current.width = iframe.clientWidth;
    canvasRefs.current.height = iframe.clientHeight;
    renderAnnotations();
  };

  const renderAnnotations = () => {
    if (!canvasRefs.current) return;
    const canvas = canvasRefs.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (annotations.current[currentPage] || []).forEach((annotation) => {
      ctx.fillStyle = annotation.color;
      ctx.globalAlpha = 0.5;

      if (annotation.mode === "highlight") {
        ctx.fillRect(annotation.x - 50, annotation.y - 10, 100, 20);
      } else if (annotation.mode === "underline") {
        ctx.fillRect(annotation.x - 50, annotation.y + 5, 100, 3);
      } else if (annotation.mode === "comment") {
        ctx.fillStyle = "blue";
        ctx.fillText("💬", annotation.x, annotation.y);
      }

      ctx.globalAlpha = 1.0;
    });
  };

  const goToPage = (direction: "prev" | "next") => {
    const newPage = direction === "next" ? currentPage + 1 : currentPage - 1;
    if (newPage >= 0 && newPage < numPages) {
      setCurrentPage(newPage);
      updatePdfPreview(pdfDoc!, newPage);
    }
  };

  const exportPDF = async () => {
    if (!pdfDoc) return;

    const newPdf = await PDFDocument.load(await pdfDoc.save());
    const pages = newPdf.getPages();

    for (const pageIndex in annotations.current) {
      const page = pages[parseInt(pageIndex)];
      const { width, height } = page.getSize();

      (annotations.current[parseInt(pageIndex)] || []).forEach((annotation) => {
        if (annotation.mode === "highlight") {
          page.drawRectangle({
            x: annotation.x - 50,
            y: height - annotation.y - 10,
            width: 100,
            height: 20,
            color: rgb(1, 1, 0),
            opacity: 0.5,
          });
        } else if (annotation.mode === "underline") {
          page.drawRectangle({
            x: annotation.x - 50,
            y: height - annotation.y + 5,
            width: 100,
            height: 3,
            color: rgb(0, 0, 1),
            opacity: 0.8,
          });
        } else if (annotation.mode === "comment") {
          page.drawText("💬", {
            x: annotation.x,
            y: height - annotation.y,
            color: rgb(0, 0, 1),
            size: 12,
          });
        }
      });
    }

    const modifiedPdfBytes = await newPdf.save();
    const blob = new Blob([modifiedPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "annotated.pdf";
    link.click();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setAnnotationMode("highlight")} className="btn rounded-md p-3 text-[14px] bg-yellow-500 hover:bg-yellow-600">Highlight</button>
        <button onClick={() => setAnnotationMode("underline")} className=" rounded-md p-3 text-[14px] bg-blue-500 hover:bg-blue-600">Underline</button>
        <button onClick={() => setAnnotationMode("signature")} className="btn rounded-md p-3 text-[14px] bg-gray-700 hover:bg-gray-800">Signature</button>
        <button onClick={() => setAnnotationMode("comment")} className="btn rounded-md p-3 text-[14px] bg-green-500 hover:bg-green-600">Comment</button>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10   text-[14px] border rounded-md cursor-pointer" />
        <button onClick={() => { annotations.current = {}; renderAnnotations(); }} className="btn bg-red-500 rounded-md p-3 text-[14px] hover:bg-red-600">Clear</button>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => goToPage("prev")} disabled={currentPage === 0} className="btn bg-gray-500 rounded-md p-3 text-[14px] hover:bg-gray-600 disabled:opacity-50">← Prev</button>
        <span className="text-lg font-semibold">Page {currentPage + 1} of {numPages}</span>
        <button onClick={() => goToPage("next")} disabled={currentPage === numPages - 1} className="btn bg-gray-500 rounded-md p-3 text-[14px] hover:bg-gray-600 disabled:opacity-50">Next →</button>
      </div>

      <div className="relative border bg-white shadow-md">
        {pdfUrl && <iframe id="pdfIframe" src={pdfUrl} className="w-[90%] h-[80vh] pointer-events-none" />}
        <canvas ref={canvasRefs} className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-auto z-10"></canvas>
      </div>

      <button onClick={exportPDF} className="btn rounded-md p-3 text-[14px] bg-purple-500 hover:bg-purple-600 mt-4">Export PDF</button>
    </div>
  );
};

export default PDFViewer;
