import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Search, Send, Mic, Music } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { API_URL } from "@/config/api";

interface Document {
  id: string;
  name: string;
  category: string;
  date: string;
}

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
}

// Basic formatter to render headings and bullet lists for assistant text
const renderStructuredContent = (content: string) => {
  const lines = content.split(/\r?\n/).map(l => l.trim());
  const elements: JSX.Element[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul className="list-disc pl-5 space-y-1" key={`ul-${elements.length}`}>
          {listItems.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const applyInline = (text: string) => {
    // Bold **text**
    return text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  };

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) {
      flushList();
      return;
    }
    // Bullet points starting with * or -
    if (/^[*-]\s+/.test(line)) {
      const item = line.replace(/^[*-]\s+/, "");
      listItems.push(applyInline(item));
      return;
    }
    // Heading-like lines ending with ':'
    if (/[^:]+:\s*$/.test(line)) {
      flushList();
      elements.push(
        <div key={`h-${idx}`} className="mt-3 mb-1 font-semibold text-white">
          {line.replace(/:$/, "")}
        </div>
      );
      return;
    }
    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: applyInline(line) }} />
    );
  });

  flushList();
  return <div className="space-y-2">{elements}</div>;
};

const getCurrentTimestamp = () =>
  new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

const generateId = () => Date.now().toString();

const Education = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const elderId = searchParams.get("elder_id") || (typeof window !== "undefined" ? sessionStorage.getItem("selectedElderId") : null);
  const lastFileKey = elderId ? `edu:lastFile:${elderId}` : null;
  const elderName = searchParams.get("elder_name") || (typeof window !== "undefined" ? sessionStorage.getItem("selectedElderName") : null);

  const medicalInputRef = useRef<HTMLInputElement>(null);
  const songInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  // audio player
  const [currentSongUrl, setCurrentSongUrl] = useState<string | null>(null);
  const [currentSongName, setCurrentSongName] = useState<string | null>(null);
  // quiz state
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);

  // -------------------- Load persisted files and messages --------------------
  useEffect(() => {
    const init = async () => {
      if (!elderId) return;
      try {
        const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
        const headers: Record<string, string> = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        // Load files
        const filesRes = await fetch(`${API_URL}/education/files?elder_id=${encodeURIComponent(elderId)}`, { headers });
      if (filesRes.ok) {
          const files = await filesRes.json();
          const docs: Document[] = files.map((f: any) => ({
            id: f.id,
            name: f.filename,
            category: (f.category || "").charAt(0).toUpperCase() + (f.category || "").slice(1),
            date: f.created_at ? new Date(f.created_at).toLocaleDateString("en-GB") : "",
          }));
          setDocuments(docs);
        // Restore last selected file for this elder if available
        if (!currentFile && lastFileKey) {
          const saved = typeof window !== 'undefined' ? sessionStorage.getItem(lastFileKey) : null;
          if (saved && docs.some(d => d.name === saved)) {
            setCurrentFile(saved);
          }
        }
        }

        // Load messages
        const msgRes = await fetch(`${API_URL}/education/messages?elder_id=${encodeURIComponent(elderId)}&limit=50`, { headers });
        if (msgRes.ok) {
          const msgs = await msgRes.json();
          const hydrated: ChatMessage[] = msgs.map((m: any) => ({
            id: m.id,
            type: m.role === "user" ? "user" : "assistant",
            content: m.content,
            timestamp: m.created_at ? new Date(m.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : getCurrentTimestamp(),
          }));
          setMessages(hydrated.length > 0 ? hydrated : [{
            id: generateId(),
            type: "assistant",
            content: "Hello! I'm your health assistant. Upload a PDF or image and ask me anything about it.",
            timestamp: getCurrentTimestamp(),
          }]);
        }
      } catch {
        // ignore
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elderId]);

  // -------------------- File Upload Handlers --------------------
  const handleFileUpload = (ref: React.RefObject<HTMLInputElement>) =>
    ref.current?.click();

  const uploadFile = async (file: File, category: string) => {
    if (!elderId) {
      toast({ title: "Select elder", description: "Missing elder context.", variant: "destructive" });
      return;
    }
    if (category === "songs" && !["audio/mpeg", "audio/mp3"].includes(file.type)) {
      toast({
        title: "Error",
        description: "Only MP3 files are accepted.",
        variant: "destructive",
      });
      return;
    }
    if (category === "medical" || category === "stories") {
      const allowed = [
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];
      if (!allowed.includes(file.type)) {
        toast({
          title: "Error",
          description: "Only PDF or image (jpg/png/webp) files are accepted.",
          variant: "destructive",
        });
        return;
      }
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/education/upload/${category}?elder_id=${encodeURIComponent(elderId)}`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      const newDoc: Document = {
        id: generateId(),
        name: file.name,
        category: category.charAt(0).toUpperCase() + category.slice(1),
        date: new Date().toLocaleDateString("en-GB"),
      };

      setDocuments((prev) => [newDoc, ...prev]);
      setCurrentFile(file.name);
      if (lastFileKey) sessionStorage.setItem(lastFileKey, file.name);

      toast({ title: "Success", description: data.message });

      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: "assistant",
        content:
          category === "songs"
            ? `I've processed your song file "${file.name}".`
            : `I've processed your ${category} file "${file.name}". You can now ask me questions about it.\n\n**What would you like me to do?**\n- Summarize it\n- List key points\n- Generate a quiz`,
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      toast({
        title: "Error",
        description: "Failed to upload file.",
        variant: "destructive",
      });
    }
  };

  const handleFileChange = (category: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    uploadFile(file, category);
  };

  // -------------------- Sending a message/question --------------------
  const handleSendMessage = async (customMessage?: string) => {
    const messageToSend = customMessage || messageInput;
    if (!messageToSend.trim()) return;
    if (!elderId) {
      toast({ title: "Select elder", description: "Missing elder context.", variant: "destructive" });
      return;
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      type: "user",
      content: messageToSend,
      timestamp: getCurrentTimestamp(),
    };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(
        `${API_URL}/education/ask?question=${encodeURIComponent(
          messageToSend
        )}${currentFile ? `&filename=${encodeURIComponent(currentFile)}` : ""}&elder_id=${encodeURIComponent(elderId)}`,
        { headers }
      );
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();

      // If song returned
      if (data.song_url) {
        const fullUrl = `${API_URL}${data.song_url}`;
        try {
          const audioRes = await fetch(fullUrl, { headers });
          if (!audioRes.ok) throw new Error("Failed to fetch song");
          const blob = await audioRes.blob();
          const objectUrl = URL.createObjectURL(blob);
          setCurrentSongUrl(objectUrl);

          const params = new URLSearchParams(fullUrl.split("?")[1]);
          const fileParam = params.get("filename");
          setCurrentSongName(fileParam || "Song");

          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.load();
              audioRef.current.play().catch(() => {});
            }
          }, 300);
        } catch (_) {
          // fall back to showing answer only if song fetch fails
        }
      }

      const assistantMessage: ChatMessage = {
        id: generateId(),
        type: "assistant",
        content: data.answer || "Sorry, I couldn't find an answer.",
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        type: "assistant",
        content: "Failed to connect to the server.",
        timestamp: getCurrentTimestamp(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setMessageInput("");
  };

  // -------------------- Voice Input --------------------
  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "Error",
        description: "Speech recognition is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessageInput(transcript);
      handleSendMessage(transcript);
    };

    recognition.onerror = (event: any) => {
      toast({
        title: "Voice Error",
        description: event.error || "Something went wrong with voice input.",
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/elders")}
            aria-label="Go back"
            className="mr-4 text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white">Health Assistent</h1>
            <p className="text-gray-400 mt-2">
              Access your medical history get instant help from our AI assistant
            </p>
            {elderName && (
              <div className="mt-2 inline-flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-200">Elder: {elderName}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Upload Sections */}
          <Card className="p-6 bg-[#1e1e1e] border border-gray-800 space-y-6">
            {/* Medical */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Medical Documents</h2>
                <Button
                  onClick={() => handleFileUpload(medicalInputRef)}
                  className="bg-gray-700 hover:bg-gray-600"
                >
                  <Upload className="w-4 h-4 mr-2" /> Upload
                </Button>
              </div>
              <input
                ref={medicalInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={(e) => handleFileChange("medical", e)}
                className="hidden"
              />
            </div>

            {/* Stories upload removed: use the Medical Documents upload for PDFs and images */}

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files..."
                className="pl-10 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`p-4 rounded-lg border ${
                      currentFile === doc.name
                        ? "bg-blue-900 border-blue-600"
                        : "bg-[#1e1e1e] border-gray-700 hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 cursor-pointer" onClick={() => { if (doc.category !== "Songs") { setCurrentFile(doc.name); if (lastFileKey) sessionStorage.setItem(lastFileKey, doc.name); } }}>
                        <h3 className="font-semibold text-white mb-2">{doc.name}</h3>
                        <div className="flex justify-between items-center text-sm text-gray-400">
                          <span className="px-2 py-1 bg-gray-700 rounded-md">{doc.category}</span>
                          <span>{doc.date}</span>
                        </div>
                      </div>
                      <button
                        className="shrink-0 px-2 py-1 text-xs rounded border border-red-600 text-red-500 hover:bg-red-600/20"
                        onClick={async () => {
                          try {
                            const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
                            const headers: Record<string, string> = {};
                            if (token) headers["Authorization"] = `Bearer ${token}`;
                            const elderIdParam = elderId ? `elder_id=${encodeURIComponent(elderId)}` : "";
                            const q = `${elderIdParam}&filename=${encodeURIComponent(doc.name)}&category=${encodeURIComponent(doc.category.toLowerCase())}`;
                            const res = await fetch(`${API_URL}/education/file?${q}`, { method: "DELETE", headers });
                            if (!res.ok) throw new Error("Delete failed");
                            setDocuments(prev => prev.filter(d => d.id !== doc.id));
                            if (currentFile === doc.name) { setCurrentFile(null); if (lastFileKey) sessionStorage.removeItem(lastFileKey); }
                          } catch {
                            // optionally toast error
                          }
                        }}
                        aria-label="Delete"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center">No files found.</p>
              )}
            </div>
          </Card>

          {/* Assistant */}
          <Card className="p-6 bg-[#1e1e1e] border border-gray-800 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">AI Health Assistant</h2>
              <span className="text-green-400">Online</span>
            </div>

            <div
              className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto"
              role="log"
              aria-live="polite"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      msg.type === "user"
                        ? "bg-gray-700 text-white"
                        : "bg-[#1e1e1e] text-white"
                    }`}
                  >
                    {msg.type === "assistant" ? (
                      renderStructuredContent(msg.content)
                    ) : (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Song player */}
            {currentSongUrl && (
              <div className="mb-4 p-3 rounded-lg bg-gray-800 flex items-center gap-3">
                <Music className="w-5 h-5 text-green-400" />
                <span className="text-sm flex-1">{currentSongName}</span>
                <audio ref={audioRef} controls src={currentSongUrl} className="w-40" />
              </div>
            )}

            {/* Quick actions when a file is selected */}
            {currentFile && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`Summarize the uploaded document "${currentFile}" in a concise, student-friendly way.`)}>Summarize</Button>
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`List the key points and takeaways from the uploaded document "${currentFile}" as clean bullet points.`)}>Key Points</Button>
                <Button size="sm" disabled={quizLoading} className={`bg-gray-700 hover:bg-gray-600 ${quizLoading ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={async () => {
                  if (!elderId || !currentFile) return;
                  try {
                    setQuizLoading(true);
                    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
                    const headers: Record<string, string> = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(`${API_URL}/education/quiz?elder_id=${encodeURIComponent(elderId)}&filename=${encodeURIComponent(currentFile)}&num=10`, { headers });
                    if (!res.ok) throw new Error('Quiz generation failed');
                    const data = await res.json();
                    const qs: QuizQuestion[] = data.questions || [];
                    setQuiz(qs);
                    setAnswers(new Array(qs.length).fill(-1));
                    setShowResults(false);
                  } catch {
                    // silently ignore or toast if you prefer
                  } finally {
                    setQuizLoading(false);
                  }
                }}>Generate Quiz</Button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button onClick={() => handleSendMessage()} className="bg-gray-700 hover:bg-gray-600">
                <Send className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                className={`${
                  isListening ? "text-green-400 animate-pulse" : "text-gray-400 hover:text-white"
                }`}
                onClick={handleVoiceInput}
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          {quiz && (
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800 mt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Quiz</h3>
                <div className="text-sm text-gray-300">Answered {answers.filter(a => a !== -1).length} / {quiz.length}</div>
              </div>
              <div className="space-y-6">
                {quiz.map((q, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="font-medium">{idx + 1}. {q.question}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => {
                        const selected = answers[idx] === oi;
                        const correct = showResults && q.answerIndex === oi;
                        const wrongSel = showResults && selected && q.answerIndex !== oi;
                        const letter = String.fromCharCode(65 + oi);
                        return (
                          <button
                            key={oi}
                            onClick={() => !showResults && setAnswers(prev => { const copy = [...prev]; copy[idx] = oi; return copy; })}
                            className={`text-left px-3 py-2 rounded border transition-colors flex items-start gap-2 ${
                              correct ? 'border-green-600 bg-green-900/30' : wrongSel ? 'border-red-600 bg-red-900/30' : selected ? 'border-blue-600 bg-blue-900/20' : 'border-gray-700 hover:bg-gray-800'
                            }`}
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mt-0.5 ${selected ? 'bg-blue-600' : 'bg-gray-700'}`}>{letter}</span>
                            <span>{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex gap-2">
                {!showResults ? (
                  <Button disabled={answers.some(a => a === -1)} className={`bg-gray-700 hover:bg-gray-600 ${answers.some(a => a === -1) ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={() => setShowResults(true)}>Submit</Button>
                ) : (
                  <Button variant="outline" className="border-gray-700" onClick={() => { setShowResults(false); setAnswers(new Array(quiz.length).fill(-1)); }}>Retry</Button>
                )}
                {showResults && (
                  <div className="ml-2 self-center text-sm text-gray-300">
                    Score: {answers.reduce((acc, a, i) => acc + (a === quiz[i].answerIndex ? 1 : 0), 0)} / {quiz.length}
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Education;