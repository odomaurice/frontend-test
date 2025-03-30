import PDFAnnotation from "@/components/PDFAnnotation";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


export default function Home() {
  return (
    <div className="font-header bg-pink-50">
       <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
      <PDFAnnotation/>
    </div>
  );
}
