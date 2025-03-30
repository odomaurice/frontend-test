import React, { useState, useEffect, useRef,  useCallback } from "react";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { Menu, X } from "lucide-react";

interface PDFViewerProps {
  file: File;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ file }) => {
  const [pdfDoc, setPdfDoc] = useState<PDFDocument | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const [annotationMode, setAnnotationMode] = useState<string | null>(null);
  const [color, setColor] = useState<string>("#FF0000");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfRef = useRef<PDFDocument | null>(null);

  const annotations = useRef<
    Record<
      number,
      Array<{
        x: number;
        y: number;
        mode: string;
        color: string;
        text?: string;
        path?: { x: number; y: number }[];
      }>
    >
  >({});
  const isDrawing = useRef(false);
  const signaturePath = useRef<Array<{ x: number; y: number }>>([]);

  // const isMobile = window.innerWidth <= 768;

  useEffect(() => {
    const handleResize = () => {
      setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

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

 

const loadPdf = useCallback(async () => {
  if (!file) return;

  try {
    const existingPdfBytes = await file.arrayBuffer();
    const loadedPdfDoc = await PDFDocument.load(existingPdfBytes);

    setPdfDoc(loadedPdfDoc);
    pdfRef.current = loadedPdfDoc;
    setNumPages(loadedPdfDoc.getPages().length);

    updatePdfPreview(loadedPdfDoc, 0); // Show first page
  } catch (error) {
    console.error("Error loading PDF:", error);
  }
}, [file]);

useEffect(() => {
  loadPdf();
}, [loadPdf]);



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
        ctx.globalAlpha = 1;
        ctx.fillStyle = "blue";
        ctx.font = "16px Arial";
        ctx.fillText("💬", annotation.x, annotation.y);
      } else if (annotation.mode === "signature" && annotation.path) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        annotation.path.forEach((point, index) => {
          if (index === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.stroke();
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
      if (!text || text.trim() === "") return;

      annotations.current[currentPage].push({
        x,
        y,
        mode: "comment",
        color,
        text,
      });
    } else {
      annotations.current[currentPage].push({
        x,
        y,
        mode: annotationMode,
        color,
      });
    }

    renderAnnotations(currentPage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (
      !isDrawing.current ||
      !canvasRef.current ||
      annotationMode !== "signature"
    )
      return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    signaturePath.current.push({ x, y });

    // Live rendering of signature
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      signaturePath.current.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
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

    // Register fontkit before embedding fonts
    pdfDoc.registerFontkit(fontkit);

    const fontBytes = await fetch("/NotoSans-VariableFont_wdth,wght.ttf").then(
      (res) => res.arrayBuffer()
    );

    const emojiFont = await pdfDoc.embedFont(fontBytes, { subset: true });

    const pages = pdfDoc.getPages();

    Object.keys(annotations.current).forEach((pageIndexStr) => {
      const pageIndex = parseInt(pageIndexStr);
      const page = pages[pageIndex];

      const { height } = page.getSize();

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
            font: emojiFont,
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
    const updatedPdfBlob = new Blob([updatedPdfBytes], {
      type: "application/pdf",
    });

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
    <div className="relative w-full h-screen flex flex-col">
      {/* Header Toolbar */}
      <div className="bg-gray-100 z-10 text-black    p-2 shadow-md">
        <button className="lg:hidden p-2" onClick={toggleMenu}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div
          className={`md:flex ${
            menuOpen ? "flex" : "hidden"
          } flex-col md:flex-row   p-2 bg-gray-100 z-50 md:bg-transparent  gap-4 absolute lg:relative  left-0 w-full lg:w-auto shadow-md md:shadow-none`}
        >
          <button onClick={() => setAnnotationMode("highlight")} className="">
            Highlight
          </button>
          <button onClick={() => setAnnotationMode("underline")} className="">
            Underline
          </button>
          <button onClick={() => setAnnotationMode("signature")} className="">
            Signature
          </button>
          <button onClick={() => setAnnotationMode("comment")} className="">
            Comment
          </button>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-10 border rounded-md cursor-pointer"
          />
          <button
            onClick={() => {
              annotations.current = {};
              signaturePath.current = [];
              renderAnnotations(currentPage);
            }}
            className=""
          >
            Clear
          </button>

          <button
            onClick={() => goToPage("prev")}
            disabled={currentPage === 0}
            className="btn bg-gray-500 rounded-md p-3 hover:bg-gray-600 disabled:opacity-50"
          >
            ← Prev
          </button>
          <span className="text-lg font-semibold">
            Page {currentPage + 1} of {numPages}
          </span>
          <button
            onClick={() => goToPage("next")}
            disabled={currentPage === numPages - 1}
            className="btn bg-gray-500 rounded-md p-3 hover:bg-gray-600 disabled:opacity-50"
          >
            Next →
          </button>
          <button onClick={exportPdf} className="">
            Export PDF
          </button>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-grow relative overflow-auto flex justify-center items-center bg-gray-100">
        <div className="relative border w-[90%] bg-white shadow-md">
          {pdfUrl && (
            <iframe
              id="pdfIframe"
              src={pdfUrl}
              className="w-[90%] h-[80vh] pointer-events-none"
            />
          )}
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="absolute top-0 left-0 w-full h-full bg-transparent pointer-events-auto z-[9999]"
          ></canvas>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer;
