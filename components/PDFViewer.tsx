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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const annotations = useRef<Record<number, Array<{ x: number; y: number; mode: string; color: string; text?: string; path?: { x: number; y: number }[] }>>>({});
  const isDrawing = useRef(false);
  const signaturePath = useRef<Array<{ x: number; y: number }>>([]);


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

 
    const adjustCanvasSize = () => {
    const iframe = document.getElementById("pdfIframe") as HTMLIFrameElement;
    if (!iframe || !canvasRef.current) return;

    canvasRef.current.width = iframe.clientWidth;
    canvasRef.current.height = iframe.clientHeight;

    renderAnnotations(currentPage);
  };

 const renderAnnotations = (pageIndex: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    (annotations.current[pageIndex] || []).forEach((annotation) => {
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

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!annotationMode || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!annotations.current[currentPage]) {
      annotations.current[currentPage] = [];
    }

    if (annotationMode === "signature") {
      isDrawing.current = true;
      signaturePath.current = [{ x, y }];
    } else if (annotationMode === "comment") {
      const text = prompt("Enter your comment:");
      if (!text) return;
      annotations.current[currentPage].push({ x, y, mode: "comment", color, text });
    } else {
      annotations.current[currentPage].push({ x, y, mode: annotationMode, color });
    }

    renderAnnotations(currentPage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current || !canvasRef.current || annotationMode !== "signature") return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    signaturePath.current.push({ x, y });

    renderAnnotations(currentPage);
  };

  const handleMouseUp = () => {
    isDrawing.current = false;

    if (annotationMode === "signature" && signaturePath.current.length > 1) {
      annotations.current[currentPage].push({
        x: signaturePath.current[0].x,
        y: signaturePath.current[0].y,
        mode: "signature",
        color,
        path: [...signaturePath.current],
      });
    }

    signaturePath.current = [];
    renderAnnotations(currentPage);
  };

 const exportPdf = async () => {
  if (!pdfDoc) return;

  const pages = pdfDoc.getPages();

  Object.keys(annotations.current).forEach((pageIndexStr) => {
    const pageIndex = parseInt(pageIndexStr);
    const page = pages[pageIndex];

    const { width, height } = page.getSize();

    annotations.current[pageIndex].forEach((annotation) => {
      if (annotation.mode === "highlight") {
        page.drawRectangle({
          x: annotation.x - 50,
          y: height - annotation.y - 10, // Flip Y-axis
          width: 100,
          height: 20,
          color: rgb(1, 1, 0),
          opacity: 0.3,
        });
      } else if (annotation.mode === "underline") {
        page.drawRectangle({
          x: annotation.x - 50,
          y: height - annotation.y + 5,
          width: 100,
          height: 3,
          color: rgb(1, 0, 0),
        });
      } else if (annotation.mode === "comment") {
        page.drawText(`💬 ${annotation.text}`, {
          x: annotation.x,
          y: height - annotation.y,
          size: 12,
          color: rgb(0, 0, 1),
        });
      } else if (annotation.mode === "signature" && annotation.path) {
        const { path } = annotation;
        page.drawSvgPath(
          `M ${path.map((p) => `${p.x},${height - p.y}`).join(" L ")}`,
          { color: rgb(0, 0, 0), opacity: 1 }
        );
      }
    });
  });

  const updatedPdfBytes = await pdfDoc.save();
  const updatedPdfBlob = new Blob([updatedPdfBytes], { type: "application/pdf" });

  const downloadLink = document.createElement("a");
  downloadLink.href = URL.createObjectURL(updatedPdfBlob);
  downloadLink.download = "annotated-document.pdf";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
};

const goToPage = (direction: "prev" | "next") => {
    const newPage = direction === "next" ? currentPage + 1 : currentPage - 1;
    if (newPage >= 0 && newPage < numPages) {
      setCurrentPage(newPage);
      updatePdfPreview(pdfDoc!, newPage);
    }
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen flex flex-col items-center">
      <div className="flex gap-4 mb-4">
        <button onClick={() => setAnnotationMode("highlight")} className="btn bg-yellow-500 hover:bg-yellow-600">Highlight</button>
        <button onClick={() => setAnnotationMode("underline")} className="btn bg-blue-500 hover:bg-blue-600">Underline</button>
        <button onClick={() => setAnnotationMode("signature")} className="btn bg-gray-700 hover:bg-gray-800">Signature</button>
        <button onClick={() => setAnnotationMode("comment")} className="btn bg-green-500 hover:bg-green-600">Comment</button>
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 border rounded-md cursor-pointer" />
        <button onClick={() => { annotations.current = {}; signaturePath.current = []; renderAnnotations(currentPage); }}  className="btn bg-red-500 hover:bg-red-600">Clear</button>
      </div>

      <div className="flex gap-4 mb-4">
        <button onClick={() => goToPage("prev")} disabled={currentPage === 0} className="btn bg-gray-500 hover:bg-gray-600 disabled:opacity-50">← Prev</button>
        <span className="text-lg font-semibold">Page {currentPage + 1} of {numPages}</span>
        <button onClick={() => goToPage("next")} disabled={currentPage === numPages - 1} className="btn bg-gray-500 hover:bg-gray-600 disabled:opacity-50">Next →</button>
      </div>

      <div className="relative border bg-white shadow-md">
        {pdfUrl && <iframe id="pdfIframe" src={pdfUrl} className="w-[90%] h-[80vh] pointer-events-none" />}
       <canvas ref={canvasRef} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-auto z-10"></canvas>
      </div>

      <button onClick={exportPdf} className="btn bg-purple-500 hover:bg-purple-600 mt-4">Export PDF</button>
    </div>
    
  );
};

export default PDFViewer;
