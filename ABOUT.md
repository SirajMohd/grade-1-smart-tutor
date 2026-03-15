# About Grade 1 Smart Tutor

Grade 1 Smart Tutor is an AI-powered learning companion designed to help young students explore Math and English using a curriculum-aligned, safe, and friendly experience.

---

## 🎯 What it does

- **Curriculum-Grounded:** Uses RAG (Retrieval-Augmented Generation) to answer questions strictly based on Grade 1 NCERT textbooks, ensuring accuracy.
- **Multimodal Learning:** Generates custom, age-appropriate illustrations on the fly to visually explain concepts like addition or the natural world.
- **Live Mode:** Offers a hands-free, real-time voice interface so children can speak naturally and feel like they’re talking to a supportive friend.

---

## 🛠️ How I built it

### Frontend
- High-contrast, kid-friendly UI built with **React** and **Tailwind CSS**.

### Reasoning & RAG
- Integrated **Gemini 3 Flash** with **Vertex AI Search** to securely ground the AI’s knowledge base in a datastore of verified NCERT PDFs.
- Datastore is configured via the `VERTEX_DATASTORE` environment variable.

### Voice & Vision
- **Gemini 2.5 Flash** TTS for cheerful, natural speech.
- **Gemini 3.1 Flash Image** for on-demand educational illustrations.

### Real-time Interaction
- Implemented the **Gemini Live API** via secure WebSockets to achieve sub-second latency for natural voice conversations.

---

## 🔧 Challenges I ran into

- The Gemini TTS API returns raw PCM audio data (a continuous stream of numbers), which browsers cannot play directly.
- Solved this by engineering a custom `pcmToWav` utility that injects a 44-byte "RIFF" header so browsers can play the audio as a standard WAV file.

---

## 🏆 Accomplishments I'm proud of

- **Zero-hallucination tutoring:** Tuned system instructions and grounding so the model says "I don't know" if an answer isn’t in the datastore.
- **Seamless live mode:** The AI can be interrupted and respond instantly, mimicking a real teacher.
- **Kid-centric UX:** Balanced extreme simplicity with powerful multimodal capabilities (Text, Voice, Image).

---

## 📚 What I learned

- Vertex AI Search is incredibly powerful for educational tools.
- It can pinpoint exact source citations (e.g., "Joyful Mathematics (Class 1), Chapter 1: Finding the Furry Friends (Counting 1 to 5)").
- This traceability creates trust by proving the AI is citing real curriculum instead of fabricating answers.

---

## 🚀 What's next for Grade 1 Smart Tutor

- **Curriculum Expansion:** Scale the knowledge base to support all K-12 grade levels.
- **Multilingual Support:** Make the tutor accessible to more learners.
- **Tailored Learning Paths:** Adapt to specific school board syllabi and guided learning streams.
- **Adaptive Tutoring:** Add feedback loops to analyze comprehension and adjust teaching style dynamically.
