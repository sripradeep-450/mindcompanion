
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { UserProfile } from "../types";

// Locking mechanism to prevent overlapping TTS calls
let isSpeaking = false;

// Circuit Breaker state
let isCircuitOpen = false;
let circuitOpenUntil = 0;

export const geminiService = {
  // Check if the circuit is currently open (blocking calls)
  checkCircuit(): boolean {
    if (isCircuitOpen) {
      if (Date.now() > circuitOpenUntil) {
        isCircuitOpen = false;
        return false;
      }
      return true;
    }
    return false;
  },

  // Open the circuit for a specific duration (default 60s)
  openCircuit(duration = 60000) {
    isCircuitOpen = true;
    circuitOpenUntil = Date.now() + duration;
    console.error(`Circuit opened. AI calls paused for ${duration / 1000}s to reset quota.`);
  },

  // Helper for exponential backoff retries with jitter
  async withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 5000): Promise<T> {
    if (this.checkCircuit()) {
      throw new Error("AI is currently resting to preserve quota. Please try again in a minute.");
    }

    try {
      return await fn();
    } catch (error: any) {
      const is429 = error?.status === 429 || error?.message?.includes('429');
      
      if (is429) {
        if (retries > 0) {
          // Randomized jitter to prevent synchronized retries
          const jitter = Math.random() * 2000;
          console.warn(`Quota exceeded. Retrying in ${(delay + jitter) / 1000}s... (${retries} left)`);
          await new Promise(resolve => setTimeout(resolve, delay + jitter));
          return this.withRetry(fn, retries - 1, delay * 1.5);
        } else {
          // Out of retries, trip the circuit breaker
          this.openCircuit();
        }
      }
      throw error;
    }
  },

  async chat(message: string, profile: UserProfile): Promise<string> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `You are a supportive, patient, and friendly AI companion for a senior with dementia named ${profile.name || 'Friend'}. 
      Always use their name in your responses. Keep language simple, warm, and brief.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: message,
        config: { systemInstruction },
      });
      return response.text || "I'm here for you.";
    });
  },

  async generatePuzzle(): Promise<any> {
    try {
      return await this.withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Generate a logic puzzle for a senior. Format as JSON.",
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING },
                instruction: { type: Type.STRING },
                puzzleData: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["type", "instruction", "puzzleData", "options", "correctIndex", "explanation"]
            }
          }
        });
        return JSON.parse(response.text || "{}");
      });
    } catch (e) {
      // Fallback puzzle to avoid network calls when quota is low
      return {
        type: 'logic',
        instruction: 'Which number comes next?',
        puzzleData: '2, 4, 6, ...',
        options: ['7', '8', '9', '10'],
        correctIndex: 1,
        explanation: 'We are counting up by two!'
      };
    }
  },

  async analyzePhoto(base64Data: string, familyContext: string): Promise<string> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
          { text: `Identify people based on: ${familyContext}` }
        ]},
      });
      return response.text?.trim() || "I see some lovely people.";
    });
  },

  async summarizeJournal(text: string): Promise<string> {
    return this.withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Summarize this happy memory in one sentence: "${text}"`,
      });
      return response.text?.trim() || "A wonderful moment.";
    });
  },

  async speak(text: string): Promise<void> {
    if (isSpeaking || this.checkCircuit()) return; 
    isSpeaking = true;

    try {
      await this.withRetry(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          },
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          const audioBuffer = await this.decodeAudioData(this.decodeBase64(base64Audio), audioContext, 24000, 1);
          const source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start();
          // Keep lock until audio finishes
          await new Promise(resolve => setTimeout(resolve, audioBuffer.duration * 1000));
        }
      });
    } catch (error) {
      console.error("TTS Failed:", error);
    } finally {
      isSpeaking = false;
    }
  },

  decodeBase64(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  },

  async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
};
