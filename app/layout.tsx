import type { Metadata } from "next";
import "./globals.css";
import Link from "next/link";




export const metadata: Metadata = {
  title: "AnnotatePDF",
  description: "The better-packed alternative to Adobe Acrobat",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="bg-pink-50"
      >
         <header className="bg-white h-[75px]  text-black sticky sm:top-0 font-subtext pt-4 font-semibold z-50">
    
    <div className="px-8 text-amber-700 text-[30px] font-bold">
      <Link href="/">
        <h3>AnnotatePDF</h3>
      </Link>
      </div>
      </header>
        {children}
      </body>
    </html>
  );
}
