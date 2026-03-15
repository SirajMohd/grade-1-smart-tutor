What it does
Grade 1 Smart Tutor is an AI-powered learning companion currently designed to help young students explore Math and English.

Curriculum-Grounded: It utilizes RAG (Retrieval-Augmented Generation) to answer questions strictly based on Grade 1 NCERT textbooks, ensuring educational accuracy.

Multimodal Learning: It goes beyond simple text by generating custom, age-appropriate illustrations on the fly to visually explain concepts like addition or the natural world.

Live Mode: Features a hands-free, real-time voice interface that allows children to speak naturally to the tutor, making the learning experience feel like a conversation with a supportive friend.

How I built it
Frontend: Developed a high-contrast, kid-friendly user interface using React and Tailwind CSS.

Reasoning & RAG: Integrated Gemini 3 Flash with Vertex AI Search to securely ground the AI's knowledge base in a datastore of verified NCERT PDFs (configured via the `VERTEX_DATASTORE` environment variable).

Voice & Vision: Leveraged Gemini 2.5 Flash TTS for generating high-quality, cheerful speech, and Gemini 3.1 Flash Image for creating on-demand educational illustrations.

Real-time Interaction: Implemented the Gemini Live API via secure WebSockets to achieve sub-second latency for natural voice conversations.

Challenges I ran into
Handling audio streams directly from the AI proved challenging. I discovered that the Gemini TTS API returns raw PCM audio data (a continuous stream of numbers), which web browsers cannot natively play. To solve this, I engineered a custom pcmToWav utility that manually injects a 44-byte "RIFF" header into the data stream, allowing the browser to recognize and play it as a standard sound file.

Accomplishments that I am proud of
Zero-Hallucination Tutoring: By strictly tuning the system instructions and implementing Vertex AI Search grounding, I successfully forced the model to admit "I don't know" if an answer isn't in the provided datastore. This guarantees the tutor remains a safe, curriculum-accurate environment.

Seamless Live Mode: Achieved a highly natural conversational flow where the AI can be interrupted and respond instantly, mimicking a real human teacher.

Kid-Centric UX: Designed an interface that perfectly balances extreme simplicity for young users with powerful, underlying multimodal capabilities (Text, Voice, and Image).

What I learned
Vertex AI Search is exceptionally powerful for educational tools. I was highly impressed by its ability to pinpoint exact source citations—for example, returning specific metadata like "Joyful Mathematics (Class 1), Chapter 1: Finding the Furry Friends (Counting 1 to 5)". This level of traceability builds immense trust, proving the AI is citing real curriculum rather than fabricating answers.

What's next for Grade 1 Smart Tutor
The potential for this platform is boundless. My immediate roadmap includes:

Curriculum Expansion: Scaling the knowledge base to support all K-12 grade levels.

Multilingual Support: Breaking down language barriers to make the tutor accessible to a wider demographic.

Tailored Learning Paths: Streamlining the AI to adapt to specific school board syllabi and guided learning streams.

Adaptive Tutoring: Implementing feedback loops that analyze student comprehension and dynamically adjust the teaching style based on that feedback.