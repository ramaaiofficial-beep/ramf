import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Upload, Send, Search, FileText, MessageCircle, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { API_URL } from "@/config/api";

interface ChatMessage {
  id: number;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// Render headings and bullet lists like Education page
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

  const inline = (text: string) => text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flushList(); return; }
    if (/^[*-]\s+/.test(line)) {
      listItems.push(inline(line.replace(/^[*-]\s+/, "")));
      return;
    }
    if (/[^:]+:\s*$/.test(line)) {
      flushList();
      elements.push(<div key={`h-${idx}`} className="mt-3 mb-1 font-semibold">{line.replace(/:$/, '')}</div>);
      return;
    }
    flushList();
    elements.push(<p key={`p-${idx}`} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });

  flushList();
  return <div className="space-y-2">{elements}</div>;
};

interface UploadedDocument {
  id: number;
  name: string;
  uploadDate: Date;
  summary?: string;
}

interface QuizQuestion {
  question: string;
  options: string[]; // length 4
  answerIndex: number; // 0-3
}

interface LinkItem { title: string; query: string; url: string }

const GeneralKnowledge = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      type: 'assistant',
      content: 'Hello! Ask me anything about general knowledge. (PDF upload shown here is just for saving, not analyzed on this page.)',
      timestamp: new Date(),
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [youtubeSearch, setYoutubeSearch] = useState('');
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [quizLoading, setQuizLoading] = useState(false);
  const [relatedLinks, setRelatedLinks] = useState<LinkItem[] | null>(null);

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        (async () => {
          try {
            const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
            const headers: Record<string, string> = {};
            if (token) headers['Authorization'] = `Bearer ${token}`;
            const formData = new FormData();
            formData.append('file', file);
            const res = await fetch(`${API_URL}/general-knowledge/upload/docs`, {
              method: 'POST',
              headers,
              body: formData,
            });
            if (!res.ok) throw new Error('Upload failed');
            const data = await res.json();
            const newDoc: UploadedDocument = {
              id: Date.now(),
              name: file.name,
              uploadDate: new Date(),
              summary: undefined,
            };
            setUploadedDocs(prev => [newDoc, ...prev]);
            setCurrentFile(file.name);
            setQuiz(null); setAnswers([]); setShowResults(false);
            toast({ title: 'Uploaded', description: data.message || 'File uploaded' });
            // Add assistant confirmation message like Education
            setChatMessages(prev => [
              ...prev,
              {
                id: Date.now() + 2,
                type: 'assistant',
                content: `I've processed your file "${file.name}". You can now ask questions about it here.\n\n**What would you like me to do?**\n- Summarize it\n- List key points\n- Generate a quiz\n- Show relevant links`,
                timestamp: new Date(),
              },
            ]);
          } catch {
            toast({ title: 'Error', description: 'Failed to upload file', variant: 'destructive' });
          }
        })();
      }
    };
    input.click();
  };

  const handleSendMessage = async (customText?: string) => {
    const messageToSend = customText || userInput;
    if (!messageToSend.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const url = `${API_URL}/general-knowledge/ask${currentFile ? `?filename=${encodeURIComponent(currentFile)}` : ''}`;
      const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({ question: messageToSend }),
      });
      if (!res.ok) {
        throw new Error('Failed to get response');
      }
      const data = await res.json();
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.answer || 'Sorry, I could not find an answer.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    } catch {
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: 'Failed to connect to the server.',
        timestamp: new Date(),
      };
      setChatMessages(prev => [...prev, assistantMessage]);
    }

    setUserInput('');
  };
  

  const handleYoutubeSearch = () => {
    if (!youtubeSearch.trim()) return;
    
    const searchQuery = encodeURIComponent(youtubeSearch);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
    setYoutubeSearch('');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: 'chat' | 'youtube') => {
    if (e.key === 'Enter') {
      if (action === 'chat') {
        handleSendMessage();
      } else {
        handleYoutubeSearch();
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/younger')}
            className="text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">AI Learning Assistent</h1>
            <p className="text-gray-400 mt-1">
              Upload PDFs or images for context and ask general questions
            </p>
            {currentFile && (
              <div className="mt-2 inline-flex items-center gap-2 text-sm">
                <span className="px-2 py-1 rounded-md bg-gray-800 border border-gray-700 text-gray-200">Selected: {currentFile}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 border-gray-700 text-gray-300 hover:bg-gray-800"
                  onClick={() => { setCurrentFile(null); setQuiz(null); setAnswers([]); setShowResults(false); }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - PDF Upload & Documents */}
          <div className="space-y-6">
            {/* YouTube Search */}
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Youtube className="w-5 h-5 text-green-400" />
                <h2 className="text-xl font-semibold">YouTube Search</h2>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Search anything on YouTube..."
                  value={youtubeSearch}
                  onChange={(e) => setYoutubeSearch(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'youtube')}
                  className="flex-1 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
                />
                <Button onClick={handleYoutubeSearch} size="sm" className="bg-gray-700 hover:bg-gray-600">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* PDF Upload */}
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-blue-400" />
                <h2 className="text-xl font-semibold">Upload PDF</h2>
              </div>
              <Button 
                onClick={handleFileUpload}
                className="w-full bg-gray-700 hover:bg-gray-600"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose PDF File
              </Button>
            </Card>

            {/* Uploaded Documents */}
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800">
              <h2 className="text-xl font-semibold mb-4">Uploaded Documents</h2>
              <ScrollArea className="h-64">
                {uploadedDocs.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No documents uploaded yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {uploadedDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-gray-800 bg-[#1e1e1e] hover:bg-gray-800 transition-colors"
                        onClick={() => setCurrentFile(doc.name)}
                      >
                        <div className="flex items-start gap-3">
                          <FileText className="w-4 h-4 mt-1 text-blue-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">
                              {doc.name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              {doc.uploadDate.toLocaleDateString()}
                            </p>
                            {doc.summary && (
                              <p className="text-xs text-gray-400 mt-2 line-clamp-2">
                                {doc.summary}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>

          {/* Right Column - AI Chatbot */}
          <Card className="p-6 bg-[#1e1e1e] border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-purple-400" />
              <h2 className="text-xl font-semibold">AI Assistant</h2>
            </div>
            
            {/* Chat Messages */}
            <ScrollArea className="h-96 mb-4 p-4 border border-gray-800 rounded-lg bg-[#1e1e1e]">
              <div className="space-y-4">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-gray-700 text-white'
                        : 'bg-[#1e1e1e] text-white border border-gray-800'
                    }`}
                  >
                    {message.type === 'assistant' ? (
                      renderStructuredContent(message.content)
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Quick actions when a file is selected */}
            {currentFile && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`Summarize the uploaded document "${currentFile}" in a concise, student-friendly way.`)}>Summarize</Button>
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`List the key points and takeaways from the uploaded document "${currentFile}" as clean bullet points.`)}>Key Points</Button>
                <Button size="sm" disabled={quizLoading} className={`bg-gray-700 hover:bg-gray-600 ${quizLoading ? 'opacity-60 cursor-not-allowed' : ''}`} onClick={async () => {
                  if (!currentFile) return;
                  try {
                    setQuizLoading(true);
                    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
                    const headers: Record<string, string> = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(`${API_URL}/general-knowledge/quiz?filename=${encodeURIComponent(currentFile)}`, { headers });
                    if (!res.ok) throw new Error('Quiz generation failed');
                    const data = await res.json();
                    const qs: QuizQuestion[] = data.questions || [];
                    setQuiz(qs);
                    setAnswers(new Array(qs.length).fill(-1));
                    setShowResults(false);
                  } catch {
                    toast({ title: 'Error', description: 'Failed to generate quiz', variant: 'destructive' });
                  } finally {
                    setQuizLoading(false);
                  }
                }}>Generate Quiz</Button>
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={async () => {
                  if (!currentFile) return;
                  try {
                    const token = typeof window !== 'undefined' ? sessionStorage.getItem('token') : null;
                    const headers: Record<string, string> = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;
                    const res = await fetch(`${API_URL}/general-knowledge/links?filename=${encodeURIComponent(currentFile)}&num=5`, { headers });
                    if (!res.ok) throw new Error('Link fetch failed');
                    const data = await res.json();
                    setRelatedLinks(data.links || []);
                  } catch {
                    toast({ title: 'Error', description: 'Failed to fetch links', variant: 'destructive' });
                  }
                }}>Relevant Links</Button>
              </div>
            )}

            {/* Chat Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="Ask me anything about general knowledge or your uploaded PDFs..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'chat')}
                className="flex-1 min-h-[44px] max-h-32 resize-none bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
                rows={1}
              />
              <Button onClick={() => handleSendMessage()} size="sm" className="self-end bg-gray-700 hover:bg-gray-600">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          {/* Quiz Panel */}
          {quiz && (
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800 mt-6 col-span-1 lg:col-span-2">
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

          {relatedLinks && relatedLinks.length > 0 && (
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800 mt-6 col-span-1 lg:col-span-2">
              <h3 className="text-xl font-semibold mb-4">Relevant YouTube Links</h3>
              <div className="space-y-2">
                {relatedLinks.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noreferrer" className="block px-3 py-2 rounded border border-gray-700 hover:bg-gray-800">
                    <span className="font-medium">{l.title}</span>
                    <span className="ml-2 text-sm text-gray-400">({l.query})</span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneralKnowledge;