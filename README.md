PDF Annotation Tool
This project is a web-based PDF annotation tool built with Next.js, tailwindcss and pdf-lib library. It allows users to upload, annotate, and export PDFs with highlights, underlines, comments, and signatures.

🚀 Features
. Upload and view PDFs
. Highlight text with customizable colors
. Underline important sections
. Add comments to specific parts of the document
. Draw signatures anywhere on the document
. Export the annotated PDF with all modifications embedded

📌 Setup & Running Instructions
1️⃣ Clone the Repository
bash
Copy code
git clone https://github.com/odomaurice/frontend-test.git

2️⃣ Install Dependencies
bash
Copy code
npm install
# or
yarn install
3️⃣ Start the Development Server
bash
Copy code
npm run dev
# or
yarn dev
4️⃣ Open in Browser
Visit http://localhost:3000 to use the app.

🛠️ Technologies & Libraries Used
Library/Tool and	Reason for Use
Next.js 	Fast rendering and efficient routing
pdf-lib	To modify PDFs without external dependencies
TypeScript	Ensures type safety and better code maintainability
TailwindCSS	Provides a responsive and clean UI
React Hooks	For state management and component reactivity
⚠️ Challenges Faced & Solutions
1️⃣ Embedding Annotations in the Exported PDF
Issue: pdf-lib doesn’t support direct annotation layers.

Solution: Used page.drawRectangle for highlights and underlines and page.drawText for comments.

2. Syncing Canvas Annotations with PDF Pages
Issue: Canvas overlay size didn’t match the PDF view.

Solution: Adjusted the canvas size dynamically using useEffect and setTimeout.

3. Handling Page Navigation with Annotations
Issue: Switching pages would remove existing annotations.

Solution: Stored annotations in a useRef object indexed by page number.

💡 Future Enhancements
. Text Selection-Based Annotations – Instead of manual clicks, enable users to select text for highlights.Pen Tool for Freehand Drawing – Allow freehand annotations beyond signatures.
. Collaboration Mode – Multi-user annotations with real-time updates.
. Cloud Storage Integration – Save and retrieve annotations from the cloud.
. Dark Mode Support – Improve user experience with a theme toggle.
. Modularize my code and write comments 
. 















