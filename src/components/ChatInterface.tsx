import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send,
  Mic,
  Bot,
  User as UserIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useVoice } from "@/contexts/VoiceContext";

interface Message {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  profile?: {
    name?: string;
    age?: number;
    email?: string;
    phone?: string;
    address?: string;
    notes?: string;
  };
  reminders?: Array<{
    id?: string;
    medication_name?: string;
    dosage?: string;
    send_time?: string;
    phone_number?: string;
    frequency?: string;
  }>;
  isTyping?: boolean;
}

import { API_URL } from "@/config/api";

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatStarted, setChatStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [subtitleText, setSubtitleText] = useState("");
  const [startupPrompt, setStartupPrompt] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechQueueRef = useRef<string[]>([]);
  const isProcessingQueueRef = useRef(false);
  const navigate = useNavigate();
  const { voiceSettings } = useVoice();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => scrollToBottom(), [messages]);

  // Pick a random friendly heading each load (before chat starts)
  useEffect(() => {
    const prompts = [
      // App-specific prompts for Rama AI
      "Who are we caring for today? Search an elder by name.",
      "Want to add a medication reminder for an elder?",
      "Ask me about an elder’s profile to view details.",
      "Ready to manage reminders? Tell me the medicine and time.",
      "Need a quick health summary? Type your question.",
      "Open Quizzes to learn, or ask me any health topic.",
      "Upload a prescription and I’ll break it down for you.",
      "Jump back to Elders or Younger profiles? Just say their name.",
      "Looking for songs? Ask me to open Spiritual Music.",
      "What would you like to manage: Elders, Younger, or Medications?",
      "Say an elder’s name and I’ll show profile and reminders.",
      "Set a reminder like: ‘Paracetamol 650mg at 8:00 PM’.",
      "Want me to summarize a health topic for you?",
      "Start a quiz to test your knowledge — just say ‘Start Quiz’.",
      "Tell me what you need and I’ll guide you step by step.",
    ];
    const idx = Math.floor(Math.random() * prompts.length);
    setStartupPrompt(prompts[idx]);
  }, []);

  // --- Speech synthesis handling ---
  const processSpeechQueue = (messageId: string) => {
    if (isProcessingQueueRef.current || speechQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;
    setIsSpeaking(true);
    setSpeakingMessageId(messageId);

    const speakNext = () => {
      if (speechQueueRef.current.length === 0) {
        isProcessingQueueRef.current = false;
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setSubtitleText("");
        return;
      }

      const textToSpeak = speechQueueRef.current.shift();
      if (!textToSpeak || !voiceSettings.enabled) return speakNext();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = voiceSettings.rate;
      utterance.pitch = voiceSettings.pitch;
      utterance.volume = voiceSettings.volume;

      if (voiceSettings.voice) {
        const voice = speechSynthesis.getVoices().find(v => v.name === voiceSettings.voice);
        if (voice) utterance.voice = voice;
      }

      // Word-by-word highlight sync (no delay)
      const words = textToSpeak.split(" ");
      let i = 0;
      const wordDuration = (utterance.rate * 1000) / words.length;
      const subtitleInterval = setInterval(() => {
        setSubtitleText(words.slice(0, i + 1).join(" "));
        i++;
        if (i >= words.length) clearInterval(subtitleInterval);
      }, Math.max(100, wordDuration));

      utterance.onend = () => {
        clearInterval(subtitleInterval);
        setTimeout(speakNext, 4);
      };
      speechSynthesis.speak(utterance);
    };

    speakNext();
  };

  const addToSpeechQueue = (text: string, messageId: string) => {
    if (!voiceSettings.enabled || !text.trim()) return;
    speechQueueRef.current.push(text.trim());
    processSpeechQueue(messageId);
  };

  const handleSend = async (customMessage?: string) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim() || isLoading) return;

    if (!chatStarted) {
      setChatStarted(true);
      setMessages([
        {
          id: "welcome",
          content: "Hey there! I'm Rama — your voice companion. Let's talk!",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content: messageToSend,
      role: "user",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers: any = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      
      const res = await fetch(`${API_URL}/chat/`, {
        method: "POST",
        headers: headers,
        body: JSON.stringify({ message: messageToSend }),
      });
      const data = await res.json();

      // If we have profile or reminders, don't show the default fallback message
      const replyContent = data.reply || (data.profile || data.reminders ? "" : "I couldn't find an answer.");

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: replyContent,
        role: "assistant",
        timestamp: new Date(),
        profile: data.profile || undefined,
        reminders: data.reminders || undefined,
      };
      setMessages(prev => [...prev, aiMessage]);
      // Only add to speech queue if there's actual content to speak
      if (replyContent) {
        addToSpeechQueue(replyContent, aiMessage.id);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          content: "Oops, having trouble connecting. Try again in a moment.",
          role: "assistant",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Speech Recognition ---
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const handleVoiceInput = () => {
    if (!SpeechRecognition) return alert("Speech recognition not supported.");
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => handleSend(e.results[0][0].transcript);
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-black text-white px-4 relative overflow-hidden">
      {/* Apple Intelligence-style border glow */}
      <div
        className={cn(
          "absolute inset-0 pointer-events-none transition-opacity duration-700",
          isSpeaking ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="absolute inset-0 border-4 border-transparent bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 rounded-3xl blur-xl animate-border-glow" 
             style={{ 
               mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
               maskComposite: 'exclude',
               padding: '2px'
             }} 
        />
      </div>

      {/* Siri-like central orb when listening - positioned lower with mic icon */}
      {isListening && (
        <div className="absolute inset-0 flex items-end justify-center pb-40 pointer-events-none z-50">
          <div className="relative">
            <div className="absolute w-64 h-64 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 blur-3xl opacity-30 animate-pulse" />
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 animate-siri-wave flex items-center justify-center">
              <Mic className="h-12 w-12 text-white animate-pulse" />
            </div>
            <div className="absolute inset-0 w-32 h-32 rounded-full bg-white/10 animate-waveform" />
          </div>
        </div>
      )}

      {/* Ambient gradient pulse */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br from-purple-800/20 via-black to-blue-800/20 blur-3xl transition-all duration-700",
          isSpeaking && "animate-pulse-slow"
        )}
      />

      {/* Removed peeking assistant illustration per request */}

      {!chatStarted && (
        <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 animate-fade-in">
          {startupPrompt}
        </h1>
      )}

      {chatStarted && (
        <div className="w-full max-w-4xl h-[60vh] overflow-y-auto p-4 bg-[#0a0a0a]/80 backdrop-blur-lg rounded-2xl mb-6 space-y-6 border border-gray-800 shadow-xl">
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.role === "user" ? "ml-auto" : "")}>
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-xl shadow-md transition-all duration-200",
                  msg.role === "assistant"
                    ? "bg-[#1e1e1e]/80 border border-purple-800/40"
                    : "bg-gradient-to-br from-purple-600/80 to-blue-600/80 text-white ml-auto"
                )}
              >
                {/* Show full text with word-by-word highlight for speaking messages */}
                {msg.role === "assistant" && isSpeaking && speakingMessageId === msg.id ? (
                  <div>
                    <span className="text-purple-300 font-medium">{subtitleText}</span>
                    <span className="text-gray-500">{msg.content.substring(subtitleText.length)}</span>
                  </div>
                ) : (
                  msg.content
                )}
                
                {/* Display profile information if available */}
                {msg.profile && (
                  <div className="mt-3 p-3 bg-[#2a2a2a]/60 rounded-lg border border-purple-700/30">
                    <div className="text-xs text-purple-300 font-semibold mb-2">Profile Details:</div>
                    <div className="space-y-1 text-sm text-gray-300">
                      {msg.profile.name && <div><span className="text-purple-400 font-medium">Name:</span> {msg.profile.name}</div>}
                      {msg.profile.age && <div><span className="text-purple-400 font-medium">Age:</span> {msg.profile.age}</div>}
                      {msg.profile.email && <div><span className="text-purple-400 font-medium">Email:</span> {msg.profile.email}</div>}
                      {msg.profile.phone && <div><span className="text-purple-400 font-medium">Phone:</span> {msg.profile.phone}</div>}
                      {msg.profile.address && <div><span className="text-purple-400 font-medium">Address:</span> {msg.profile.address}</div>}
                      {msg.profile.notes && <div className="mt-2 pt-2 border-t border-gray-700"><span className="text-purple-400 font-medium">Notes:</span> {msg.profile.notes}</div>}
                    </div>
                  </div>
                )}

                {/* Display elder's medication reminders right after the profile */}
                {msg.reminders && msg.reminders.length > 0 && (
                  <div className="mt-3 p-3 bg-[#2a2a2a]/60 rounded-lg border border-blue-700/30">
                    <div className="text-xs text-blue-300 font-semibold mb-2">Upcoming Medications:</div>
                    <div className="space-y-1 text-sm text-gray-300">
                      {msg.reminders.map((r, idx) => (
                        <div key={r.id || idx} className="flex flex-col">
                          <span>
                            <span className="text-blue-400 font-medium">{r.medication_name}</span>
                            {r.dosage ? ` (${r.dosage})` : ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {r.send_time}
                            {r.frequency ? ` • ${r.frequency}` : ""}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <span className="text-xs opacity-60 mt-2 block text-right">{msg.timestamp.toLocaleTimeString()}</span>
              </div>
              {msg.role === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <UserIcon className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2 items-center">
              <Bot className="w-5 h-5 text-purple-400 animate-pulse" />
              <span className="text-sm text-gray-400">Thinking...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex items-center w-[600px] max-w-full bg-[#1e1e1e]/70 backdrop-blur-lg rounded-full px-4 py-2 shadow-xl border border-gray-800 hover:shadow-purple-700/20 transition relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Speak or type your message..."
          className="flex-1 bg-transparent border-0 focus:ring-0 text-white placeholder:text-gray-400"
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isLoading}
        />
        <Button
          onClick={handleVoiceInput}
          variant="ghost"
          size="icon"
          className={cn(
            "transition relative",
            isListening ? "text-green-400" : "text-gray-400 hover:text-purple-400"
          )}
        >
          <Mic className={cn("h-5 w-5", isListening && "animate-pulse")} />
        </Button>
        <Button
          onClick={() => handleSend()}
          disabled={!input.trim() || isLoading}
          variant="ghost"
          size="icon"
          className="text-gray-400 hover:text-purple-400 transition"
        >
          <Send className="h-5 w-5" />
        </Button>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes siriWave {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .animate-siri-wave {
          animation: siriWave 1.5s ease-in-out infinite;
        }

        @keyframes waveform {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.4); opacity: 0.9; }
        }
        .animate-waveform {
          animation: waveform 1.2s ease-in-out infinite;
        }

        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        @keyframes border-glow {
          0%, 100% { 
            background-position: 0% 50%;
            opacity: 0.8;
          }
          50% { 
            background-position: 100% 50%;
            opacity: 1;
          }
        }
        .animate-border-glow {
          background-size: 200% 200%;
          animation: border-glow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
