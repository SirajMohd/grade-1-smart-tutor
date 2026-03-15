import { GoogleGenAI, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";

const getSettings = () => {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    projectId: process.env.PROJECT_ID,
    datastoreId: process.env.DATASTORE_ID,
    location: process.env.LOCATION,
    collectionId: process.env.COLLECTION_ID
  };
};


  const settings = getSettings();

  if (!settings.apiKey) {
    throw new Error("No API Key found. Please add one in Settings (top right)! 🔑");
  }

const ai = new GoogleGenAI({ apiKey: settings.apiKey });

export interface ChatMessage {
  role: "user" | "model";
  text: string;
  image?: string;
}

export async function getTutorResponse(message: string, history: ChatMessage[]) {
  const model = "gemini-3-flash-preview";
  const contents = history.map(msg => ({
    role: msg.role,
    parts: [{ text: msg.text }]
  }));
  
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  console.log("--- DEBUG: Request to Gemini ---");
  console.log("Model:", model);

  try {
    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        systemInstruction: "You are a Grade 1 Teacher. You MUST use the search tool to answer from NCERT books. If you cannot find the books, explain that you are looking for them in the library.",
        tools: [
          { 
            vertexAiSearch: {
              datastore: `projects/${settings.projectId}/locations/${settings.location}/collections/${settings.collectionId}/dataStores/${settings.datastoreId}`
            }
          }
        ] as any[],
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ] as any[]
      }
    });

    console.log("--- DEBUG: Gemini Response ---");
    console.log("Full Response:", JSON.stringify(response, null, 2));
    
    if (response.candidates?.[0]?.groundingMetadata) {
      console.log("Grounding Metadata:", JSON.stringify(response.candidates[0].groundingMetadata, null, 2));
    }

    return response;
  } catch (error) {
    console.error("Error in getTutorResponse:", error);
    throw error;
  }
}

export interface LiveSessionCallbacks {
  onAudioData: (base64Data: string) => void;
  onInterrupted: () => void;
  onTranscription: (text: string, isUser: boolean) => void;
  onError: (error: any) => void;
  onClose: () => void;
}

export function connectToLiveTutor(callbacks: LiveSessionCallbacks) {
  return ai.live.connect({
    model: "gemini-2.5-flash-native-audio-preview-09-2025",
    callbacks: {
      onopen: () => {
        console.log("Live session opened");
      },
      onmessage: async (message: LiveServerMessage) => {
        if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
          callbacks.onAudioData(message.serverContent.modelTurn.parts[0].inlineData.data);
        }
        
        if (message.serverContent?.interrupted) {
          callbacks.onInterrupted();
        }

        if (message.serverContent?.modelTurn?.parts[0]?.text) {
          callbacks.onTranscription(message.serverContent.modelTurn.parts[0].text, false);
        }
      },
      onerror: (error) => {
        console.error("Live session error:", error);
        callbacks.onError(error);
      },
      onclose: () => {
        console.log("Live session closed");
        callbacks.onClose();
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
      },
      systemInstruction: "You are a Grade 1 Teacher. You are in a live conversation with a child. Use ONLY the NCERT textbooks in your datastore to answer. Keep your answers very short, simple, and friendly. Encourage the child. If the answer isn't in the textbooks, say you don't know. If you hear the child interrupt, stop talking immediately.",
      tools: [{ 
        vertexAiSearch: {
          datastore:  `projects/${settings.projectId}/locations/${settings.location}/collections/${settings.collectionId}/dataStores/${settings.datastoreId}`
        } 
      }] as any[],
      inputAudioTranscription: {},
      outputAudioTranscription: {}
    },
  });
}

function pcmToWav(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = window.atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const buffer = new ArrayBuffer(44 + len);
  const view = new DataView(buffer);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false);
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false);
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false);
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false);
  // data chunk length
  view.setUint32(40, len, true);

  // Write PCM data
  for (let i = 0; i < len; i++) {
    view.setUint8(44 + i, bytes[i]);
  }

  const blob = new Blob([buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function generateSpeech(text: string): Promise<string | null> {
  // Clean text for TTS: remove markdown, citations, and limit length
  const cleanText = text
    .replace(/\[\d+\]/g, '') // Remove citations like [1]
    .replace(/\*\*/g, '')    // Remove bold
    .replace(/\*/g, '')      // Remove italic
    .replace(/#/g, '')       // Remove headers
    .replace(/`/g, '')       // Remove code blocks
    .trim()
    .slice(0, 1000);         // Limit length to avoid API issues

  console.log("--- DEBUG: Generating Speech ---");
  console.log("Original length:", text.length);
  console.log("Cleaned text:", cleanText);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say cheerfully: ${cleanText}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    const base64Audio = part?.inlineData?.data;
    const mimeType = part?.inlineData?.mimeType;
    
    if (base64Audio) {
      console.log("Speech generated successfully. MIME type:", mimeType);
      // If it's raw PCM (often returned as audio/pcm or audio/l16), we need a WAV header
      if (mimeType?.includes('pcm') || mimeType?.includes('l16') || !mimeType) {
        return pcmToWav(base64Audio, 24000);
      }
      return `data:${mimeType};base64,${base64Audio}`;
    }
    console.warn("No audio data in TTS response");
    return null;
  } catch (error) {
    console.error("Error generating speech:", error);
    // Re-throw if it's a 500 to see if it persists with cleaned text
    // But for the UI, we return null to avoid crashing the chat
    return null;
  }
}

export async function generateDrawing(description: string): Promise<string | null> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-image-preview",
      contents: [{ parts: [{ text: description }] }],
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating drawing:", error);
    return null;
  }
}
