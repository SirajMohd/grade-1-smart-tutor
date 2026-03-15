import { useState, useEffect, useRef, useCallback } from 'react';
import { connectToLiveTutor } from '../services/gemini';

export function useLiveTutor() {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<{ text: string, isUser: boolean }[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sessionRef = useRef<any>(null);
  const audioQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextStartTimeRef = useRef(0);

  const stopLive = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsLive(false);
    setIsConnecting(false);
  }, []);

  const startLive = useCallback(async () => {
    if (isLive || isConnecting) return;
    setIsConnecting(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      const sessionPromise = connectToLiveTutor({
        onAudioData: (base64Data) => {
          // Decode base64 PCM to Float32
          const binaryString = window.atob(base64Data);
          const len = binaryString.length;
          const bytes = new Int16Array(len / 2);
          for (let i = 0; i < len; i += 2) {
            bytes[i / 2] = (binaryString.charCodeAt(i + 1) << 8) | binaryString.charCodeAt(i);
          }
          
          const floatData = new Float32Array(bytes.length);
          for (let i = 0; i < bytes.length; i++) {
            floatData[i] = bytes[i] / 32768.0;
          }
          
          audioQueueRef.current.push(floatData);
          playNextChunk();
        },
        onInterrupted: () => {
          console.log("Interrupted by user");
          audioQueueRef.current = [];
          isPlayingRef.current = false;
          // We can't easily stop a scheduled BufferSourceNode, but clearing the queue helps
        },
        onTranscription: (text, isUser) => {
          setTranscription(prev => [...prev, { text, isUser }]);
        },
        onError: (err) => {
          console.error("Live error:", err);
          stopLive();
        },
        onClose: () => {
          stopLive();
        }
      });

      sessionRef.current = sessionPromise;

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert Float32 to Int16 PCM
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 32767;
        }

        // Convert to Base64
        const buffer = pcmData.buffer;
        const binary = String.fromCharCode(...new Uint8Array(buffer));
        const base64 = window.btoa(binary);

        sessionPromise.then(session => {
          session.sendRealtimeInput({
            media: { data: base64, mimeType: 'audio/pcm;rate=24000' }
          });
        });
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsLive(true);
      setIsConnecting(false);
    } catch (err) {
      console.error("Failed to start live session:", err);
      stopLive();
    }
  }, [isLive, isConnecting, stopLive]);

  const playNextChunk = useCallback(() => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0 || isPlayingRef.current) return;

    const chunk = audioQueueRef.current.shift();
    if (!chunk) return;

    isPlayingRef.current = true;
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000);
    buffer.getChannelData(0).set(chunk);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);

    const startTime = Math.max(audioContextRef.current.currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    source.onended = () => {
      isPlayingRef.current = false;
      playNextChunk();
    };
  }, []);

  useEffect(() => {
    return () => stopLive();
  }, [stopLive]);

  return { isLive, isConnecting, startLive, stopLive, transcription };
}
