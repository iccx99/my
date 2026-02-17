
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { MODEL_NAME, SYSTEM_INSTRUCTION, VOICES, VOCABULARY_TOOL } from '../constants';

export class GeminiLiveManager {
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private stream: MediaStream | null = null;
  
  private fullInputTranscription: string = '';
  private fullOutputTranscription: string = '';

  constructor() {}

  async connect(callbacks: {
    onMessage: (text: string, role: 'user' | 'model', isFinal: boolean) => void;
    onVocabularyFound: (data: { word: string; meaning: string; arabicMeaning: string; example: string; originalSentence: string }) => void;
    onError: (err: any) => void;
    onClose: () => void;
  }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

    this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    
    await this.inputAudioContext.resume();
    await this.outputAudioContext.resume();

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      throw new Error("Please allow microphone access.");
    }

    this.sessionPromise = ai.live.connect({
      model: MODEL_NAME,
      callbacks: {
        onopen: () => {
          this.startStreaming();
        },
        onmessage: async (message: LiveServerMessage) => {
          // Handle Tool Calls (Vocabulary Saving)
          if (message.toolCall) {
            for (const fc of message.toolCall.functionCalls) {
              if (fc.name === 'saveVocabularyWord') {
                callbacks.onVocabularyFound(fc.args as any);
                
                // Respond back to the model to confirm tool execution
                this.sessionPromise?.then((session) => {
                  session.sendToolResponse({
                    functionResponses: [{
                      id: fc.id,
                      name: fc.name,
                      response: { result: "Word successfully added to vocabulary list." },
                    }]
                  });
                });
              }
            }
          }

          const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audioData) {
            await this.playAudio(audioData);
          }

          if (message.serverContent?.inputTranscription) {
            this.fullInputTranscription += message.serverContent.inputTranscription.text;
            callbacks.onMessage(this.fullInputTranscription, 'user', false);
          }
          
          if (message.serverContent?.outputTranscription) {
            this.fullOutputTranscription += message.serverContent.outputTranscription.text;
            callbacks.onMessage(this.fullOutputTranscription, 'model', false);
          }

          if (message.serverContent?.turnComplete) {
            if (this.fullInputTranscription) {
              callbacks.onMessage(this.fullInputTranscription, 'user', true);
              this.fullInputTranscription = '';
            }
            if (this.fullOutputTranscription) {
              callbacks.onMessage(this.fullOutputTranscription, 'model', true);
              this.fullOutputTranscription = '';
            }
          }

          if (message.serverContent?.interrupted) {
            this.stopAllAudio();
            this.fullOutputTranscription = '';
          }
        },
        onerror: (e: any) => {
          callbacks.onError(e);
        },
        onclose: () => {
          callbacks.onClose();
        },
      },
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES.COACH } },
        },
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: [VOCABULARY_TOOL] }],
        inputAudioTranscription: {},
        outputAudioTranscription: {},
      },
    });

    return this.sessionPromise;
  }

  private startStreaming() {
    if (!this.inputAudioContext || !this.stream) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);

    scriptProcessor.onaudioprocess = (e) => {
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createBlob(inputData);
      this.sessionPromise?.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    const silentNode = this.inputAudioContext.createGain();
    silentNode.gain.value = 0;
    scriptProcessor.connect(silentNode);
    silentNode.connect(this.inputAudioContext.destination);
  }

  private async playAudio(base64: string) {
    if (!this.outputAudioContext) return;

    this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
    const buffer = await this.decodeAudioData(this.decodeBase64(base64), this.outputAudioContext, 24000, 1);
    
    const source = this.outputAudioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.outputAudioContext.destination);
    source.start(this.nextStartTime);
    
    this.nextStartTime += buffer.duration;
    this.sources.add(source);
    source.onended = () => this.sources.delete(source);
  }

  private stopAllAudio() {
    this.sources.forEach(s => {
      try { s.stop(); } catch(e) {}
    });
    this.sources.clear();
    this.nextStartTime = 0;
  }

  async disconnect() {
    try {
      const session = await this.sessionPromise;
      session?.close();
    } catch(e) {}
    
    this.stream?.getTracks().forEach(t => t.stop());
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.sessionPromise = null;
    this.fullInputTranscription = '';
    this.fullOutputTranscription = '';
  }

  private createBlob(data: Float32Array) {
    const int16 = new Int16Array(data.length);
    for (let i = 0; i < data.length; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  }

  private encodeBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decodeBase64(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
}
