# Grade 1 Smart Tutor 🎒🌟

An interactive, AI-powered learning companion designed specifically for Grade 1 students. This tutor is grounded in NCERT textbooks to provide safe, accurate, and curriculum-aligned guidance in Math, English, and Science.

## 🚀 Features

- **Curriculum-Grounded (RAG):** Uses Vertex AI Search to answer questions strictly based on Grade 1 NCERT textbooks.
- **Live Voice Mode:** Real-time, hands-free conversation using the Gemini Live API.
- **Multimodal Learning:** Generates educational illustrations on-the-fly to explain complex concepts visually.
- **Kid-Friendly UI:** A cheerful, high-contrast interface designed for young learners.
- **Smart Speech:** Text-to-Speech (TTS) with automatic markdown cleaning for natural-sounding explanations.

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, Motion (Framer Motion)
- **AI Models:**
  - **Gemini 3 Flash:** Core reasoning and RAG (Textbook grounding)
  - **Gemini 2.5 Flash:** Real-time voice (Live API) and TTS
  - **Gemini 3.1 Flash:** High-quality image generation
- **Grounding:** Vertex AI Search (NCERT Datastore)
- **Icons:** Lucide React

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Google Gemini API Key

## ⚙️ Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd grade-1-smart-tutor
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env` file in the root directory (or use the AI Studio Secrets panel) and add:
   ```env
   GEMINI_API_KEY="your_actual_api_key_here"
   VERTEX_DATASTORE="your_actual_data_Store_here/default_collection/dataStores/grade-1-pdf-data-store_1773361952998"
   ```

## 🏃 Running the App

### Development Mode
Starts the Vite development server on port 3000.
```bash
npm run dev
```

### Production Build
Builds the app for production and outputs to the `dist` folder.
```bash
npm run build
```

## 🧪 How it Works

1. **Grounding:** When a child asks a question, the app queries a Vertex AI Search datastore containing NCERT PDFs.
2. **Reasoning:** Gemini 3 Flash processes the retrieved context to generate a simplified, Grade 1-appropriate answer.
3. **Multimodal Output:** 
   - The text is cleaned of markdown.
   - **Speech:** Sent to Gemini 2.5 Flash TTS.
   - **Visuals:** If a drawing is needed, Gemini 3.1 Flash generates a relevant illustration.
4. **Live Mode:** Uses WebSockets to stream raw PCM audio at 24kHz for a seamless "always-listening" experience.

## 🛡️ Safety & Accuracy

- **Strict Grounding:** The AI is instructed to say "I don't know" if the information isn't in the provided textbooks.
- **Simplified Language:** System instructions enforce a Grade 1 vocabulary level.
- **Safety Filters:** Configured to `BLOCK_NONE` for educational categories to prevent over-censorship of science topics, while maintaining a strict teacher persona.

"# grade-1-smart-tutor" 
