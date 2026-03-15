import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, BookOpen, Calculator, User, Volume2, VolumeX, Mic, MicOff, X } from 'lucide-react';
import { getTutorResponse, generateDrawing, generateSpeech, ChatMessage } from './services/gemini';
import { useLiveTutor } from './hooks/useLiveTutor';

export default function App() {
  const [messages, setMessages] = useState<(ChatMessage & { audio?: string | null })[]>([
    { role: 'model', text: "Hi! I'm your Grade 1 tutor. 🎒 Do you want to learn about Math or English today? 🌟" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [playingAudio, setPlayingAudio] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { isLive, isConnecting, startLive, stopLive, transcription } = useLiveTutor();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, transcription]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const response = await getTutorResponse(userMessage, messages);
      let botText = response.text || "I'm sorry, I couldn't find that in our Grade 1 books. 📚 Let's try asking something else about Math or English! ✨";
      
      // Check for images in the response parts or grounding metadata
      let imageUrl = undefined;
      
      // 1. Check if model returned an image part directly (rare for grounding)
      const imagePart = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (imagePart?.inlineData) {
        imageUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
      }

      // 2. Check grounding metadata for links (if the user wants "clips from storage")
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      if (groundingMetadata?.groundingChunks) {
        console.log("Inspecting grounding chunks for images...");
        for (const chunk of groundingMetadata.groundingChunks) {
          // Look for any URI that might be an image
          const uri = chunk.web?.uri || (chunk as any).retrievalMetadata?.uri;
          if (uri && (uri.match(/\.(jpg|jpeg|png|gif|webp)$/i) || uri.includes('storage.googleapis.com'))) {
            console.log("Found potential image URI in grounding:", uri);
            imageUrl = uri;
            break;
          }
        }
      }

      // Generate speech for the bot text
      const audioUrl = await generateSpeech(botText);

      const newMessage = { 
        role: 'model' as const, 
        text: botText,
        image: imageUrl,
        audio: audioUrl
      };

      setMessages(prev => [...prev, newMessage]);

      // Auto-play audio if available
      if (audioUrl) {
        // Small delay to ensure state is updated and button is rendered
        setTimeout(() => {
          playAudio(audioUrl, messages.length + 1);
        }, 100);
      }
    } catch (error: any) {
      console.error("Tutor error:", error);
      let errorMessage = "Oops! My magic brain is a bit tired. Let's try again in a moment! 🌈";
      
      if (error?.message?.includes('API key')) {
        errorMessage = "I'm sorry, there's a problem with my key. Please check the settings! 🔑";
      } else if (error?.message?.includes('quota')) {
        errorMessage = "I've talked a lot today! My voice needs a little rest. Please try again later. 😴";
      }

      setMessages(prev => [...prev, { 
        role: 'model', 
        text: errorMessage
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (url: string, index: number) => {
    if (playingAudio === index) {
      audioRef.current?.pause();
      setPlayingAudio(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    setPlayingAudio(index);
    audio.play();
    audio.onended = () => setPlayingAudio(null);
  };

  return (
    <div className="min-h-screen bg-[#FDFCF0] font-sans text-[#4A4A4A]">
      {/* Header */}
      <header className="bg-white border-b-4 border-[#FFD93D] p-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFD93D] p-2 rounded-2xl shadow-sm">
              <Sparkles className="text-[#FF8B13] w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#FF8B13]">Grade 1 Smart Tutor</h1>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={isLive ? stopLive : startLive}
              disabled={isConnecting}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all shadow-md ${
                isLive 
                  ? 'bg-[#FF6B6B] text-white hover:bg-[#ff5252]' 
                  : 'bg-[#FFD93D] text-[#FF8B13] hover:bg-[#ffcc00]'
              }`}
            >
              {isConnecting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLive ? (
                <><MicOff size={18} /> Stop Live</>
              ) : (
                <><Mic size={18} /> Live Mode</>
              )}
            </button>
            <div className="bg-[#4D96FF] p-2 rounded-full text-white shadow-sm" title="Math">
              <Calculator size={18} />
            </div>
            <div className="bg-[#FF6B6B] p-2 rounded-full text-white shadow-sm" title="English">
              <BookOpen size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="max-w-2xl mx-auto p-4 pb-32">
        {isLive ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                boxShadow: [
                  "0 0 0 0px rgba(255, 139, 19, 0.2)",
                  "0 0 0 20px rgba(255, 139, 19, 0)",
                  "0 0 0 0px rgba(255, 139, 19, 0.2)"
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-32 h-32 bg-[#FF8B13] rounded-full flex items-center justify-center text-white shadow-xl"
            >
              <Mic size={48} />
            </motion.div>
            
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-black text-[#FF8B13]">Live Conversation</h2>
              <p className="text-gray-500">Just start talking! I can hear you. 👂</p>
            </div>

            <div className="w-full bg-white rounded-3xl p-6 border-4 border-[#FFD93D] shadow-lg max-h-64 overflow-y-auto space-y-4">
              {transcription.length === 0 ? (
                <p className="text-center text-gray-400 italic">Waiting for you to speak...</p>
              ) : (
                transcription.map((t, i) => (
                  <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      t.isUser ? 'bg-[#4D96FF] text-white' : 'bg-[#FDFCF0] text-[#4A4A4A]'
                    }`}>
                      {t.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-md ${
                      msg.role === 'user' ? 'bg-[#4D96FF]' : 'bg-[#FFD93D]'
                    }`}>
                      {msg.role === 'user' ? <User className="text-white" size={20} /> : <Sparkles className="text-[#FF8B13]" size={20} />}
                    </div>
                    
                    <div className={`p-4 rounded-3xl shadow-sm border-2 relative group ${
                      msg.role === 'user' 
                        ? 'bg-[#4D96FF] text-white border-[#3b82f6]' 
                        : 'bg-white text-[#4A4A4A] border-[#FFD93D]'
                    }`}>
                      <p className="text-lg leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      
                      {msg.role === 'model' && msg.audio && (
                        <button 
                          onClick={() => playAudio(msg.audio!, index)}
                          className="absolute -right-12 top-0 p-2 bg-white border-2 border-[#FFD93D] rounded-full text-[#FF8B13] hover:bg-[#FFD93D] transition-colors shadow-sm"
                        >
                          {playingAudio === index ? <VolumeX size={18} /> : <Volume2 size={18} />}
                        </button>
                      )}
                      
                      {msg.image && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-4 rounded-2xl overflow-hidden border-4 border-[#FFD93D] shadow-lg"
                        >
                          <img 
                            src={msg.image} 
                            alt="Tutor's drawing" 
                            className="w-full h-auto"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white border-2 border-[#FFD93D] p-4 rounded-3xl shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-[#FFD93D] rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-[#FFD93D] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-[#FFD93D] rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span className="text-sm font-medium text-gray-400 ml-2">Tutor is thinking...</span>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      {!isLive && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#FDFCF0] via-[#FDFCF0] to-transparent">
          <form 
            onSubmit={handleSend}
            className="max-w-2xl mx-auto relative"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything! 🍎"
              disabled={isLoading}
              className="w-full p-5 pr-16 rounded-full border-4 border-[#FFD93D] shadow-xl focus:outline-none focus:border-[#FF8B13] text-lg placeholder:text-gray-300 transition-all bg-white"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#FF8B13] text-white p-3 rounded-full shadow-lg hover:bg-[#FF6B6B] disabled:bg-gray-300 disabled:shadow-none transition-all"
            >
              <Send size={24} />
            </button>
          </form>
          <p className="text-center text-xs text-gray-400 mt-3 font-medium">
            I'm your AI tutor. I can make mistakes, so ask a grown-up if you're not sure! 🌈
          </p>
        </div>
      )}
    </div>
  );
}
