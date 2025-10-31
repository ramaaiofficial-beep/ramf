import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Upload, Send, Search, FileText, MessageCircle, Youtube } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Layout } from "@/components/Layout";
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
    <Layout showNav>
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/younger')}
            className="text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white">AI Learning Assistant</h1>
            <p className="text-sm sm:text-base text-gray-400 mt-2">
              Upload PDFs or images for context and ask general questions
            </p>
            {currentFile && (
              <div className="mt-2 inline-flex items-center gap-2 text-xs sm:text-sm flex-wrap">
                <span className="px-2 py-1 rounded-md bg-[#131313] border border-gray-800 text-purple-400 font-medium truncate max-w-[200px] sm:max-w-none">Selected: {currentFile}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                  onClick={() => { setCurrentFile(null); setQuiz(null); setAnswers([]); setShowResults(false); }}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Left Column - PDF Upload & Documents */}
          <div className="space-y-4 sm:space-y-6">
            {/* YouTube Search */}
            <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Youtube className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">YouTube Search</h2>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Input
                  placeholder="Search anything on YouTube..."
                  value={youtubeSearch}
                  onChange={(e) => setYoutubeSearch(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'youtube')}
                  className="flex-1 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10"
                />
                <Button 
                  onClick={handleYoutubeSearch} 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </Card>

            {/* PDF Upload */}
            <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 space-y-4 sm:space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <h2 className="text-lg sm:text-xl font-semibold text-white">Upload PDF</h2>
                </div>
              </div>
              <Button 
                onClick={handleFileUpload}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition shadow-lg"
                size="sm"
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose PDF File
              </Button>
            </Card>

            {/* Uploaded Documents */}
            <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">Uploaded Documents</h2>
              <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-96 overflow-y-auto">
                {uploadedDocs.length === 0 ? (
                  <div className="text-center py-8 px-4">
                    <FileText className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      No documents uploaded yet
                    </p>
                    <Button
                      onClick={handleFileUpload}
                      className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Document
                    </Button>
                  </div>
                ) : (
                  uploadedDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                        currentFile === doc.name
                          ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600 shadow-lg"
                          : "bg-[#131313] border-gray-700 hover:bg-[#1e1e1e] hover:border-gray-600"
                      }`}
                      onClick={() => setCurrentFile(doc.name)}
                    >
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 mt-1 text-purple-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm sm:text-base text-white mb-1 truncate">
                            {doc.name}
                          </h4>
                          <p className="text-xs sm:text-sm text-gray-400 mb-2">
                            {doc.uploadDate.toLocaleDateString()}
                          </p>
                          {doc.summary && (
                            <p className="text-xs sm:text-sm text-gray-400 line-clamp-2">
                              {doc.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - AI Chatbot */}
          <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 flex flex-col space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-purple-400" />
                <span>AI Assistant</span>
              </h2>
              <span className="text-xs sm:text-sm px-3 py-1 bg-green-600/20 border border-green-600/50 text-green-400 rounded-full font-semibold">Online</span>
            </div>
            
            {/* Chat Messages */}
            <div className="flex-1 space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-[400px] sm:max-h-96 overflow-y-auto p-2">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white'
                        : 'bg-[#131313] border border-gray-800 text-white'
                    }`}
                  >
                    {message.type === 'assistant' ? (
                      <div className="text-sm sm:text-base">
                        {renderStructuredContent(message.content)}
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed">{message.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-2 text-right">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick actions when a file is selected */}
            {currentFile && (
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm" 
                  onClick={() => handleSendMessage(`Summarize the uploaded document "${currentFile}" in a concise, student-friendly way.`)}
                >
                  Summarize
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm" 
                  onClick={() => handleSendMessage(`List the key points and takeaways from the uploaded document "${currentFile}" as clean bullet points.`)}
                >
                  Key Points
                </Button>
                <Button 
                  size="sm" 
                  disabled={quizLoading} 
                  className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm ${quizLoading ? 'opacity-60 cursor-not-allowed' : ''}`} 
                  onClick={async () => {
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
                  }}
                >
                  Generate Quiz
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm" 
                  onClick={async () => {
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
                  }}
                >
                  Relevant Links
                </Button>
              </div>
            )}

            {/* Chat Input */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10"
              />
              <Button 
                onClick={() => handleSendMessage()} 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          {/* Quiz Panel */}
          {quiz && (
            <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 mt-4 sm:mt-6 col-span-1 lg:col-span-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold text-white">Quiz</h3>
                <div className="text-xs sm:text-sm text-gray-300">Answered {answers.filter(a => a !== -1).length} / {quiz.length}</div>
              </div>
              <div className="space-y-4 sm:space-y-6">
                {quiz.map((q, idx) => (
                  <div key={idx} className="space-y-2 p-3 sm:p-4 bg-[#131313] border border-gray-800 rounded-lg">
                    <div className="font-medium text-sm sm:text-base text-white mb-3">{idx + 1}. {q.question}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => {
                        const selected = answers[idx] === oi;
                        const correct = showResults && q.answerIndex === oi;
                        const wrongSel = showResults && selected && q.answerIndex !== oi;
                        const letter = String.fromCharCode(65 + oi);
                        return (
                          <button
                            key={oi}
                            onClick={() => !showResults && setAnswers(prev => { const copy = [...prev]; copy[idx] = oi; return copy; })}
                            disabled={showResults}
                            className={`text-left px-3 py-2 rounded-lg border transition-all duration-200 flex items-start gap-2 text-xs sm:text-sm w-full ${
                              correct ? 'border-green-600 bg-green-600/20 text-green-400' : 
                              wrongSel ? 'border-red-600 bg-red-600/20 text-red-400' : 
                              selected ? 'border-purple-600 bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-white' : 
                              'border-gray-700 hover:bg-gray-800 text-gray-300'
                            } ${showResults ? 'opacity-80' : ''}`}
                          >
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs mt-0.5 flex-shrink-0 ${
                              correct ? 'bg-green-600 text-white' :
                              wrongSel ? 'bg-red-600 text-white' :
                              selected ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' :
                              'bg-gray-700 text-gray-300'
                            }`}>{letter}</span>
                            <span className="break-words flex-1 text-left">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-3 sm:gap-4 items-center">
                {!showResults ? (
                  <Button 
                    disabled={answers.some(a => a === -1)} 
                    className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition ${answers.some(a => a === -1) ? 'opacity-60 cursor-not-allowed' : ''}`}
                    onClick={() => setShowResults(true)}
                    size="sm"
                  >
                    Submit Quiz
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 transition"
                    onClick={() => { setShowResults(false); setAnswers(new Array(quiz.length).fill(-1)); }}
                    size="sm"
                  >
                    Retry Quiz
                  </Button>
                )}
                {showResults && (
                  <div className="text-xs sm:text-sm text-gray-300">
                    Score: {answers.reduce((acc, a, i) => acc + (a === quiz[i].answerIndex ? 1 : 0), 0)} / {quiz.length}
                  </div>
                )}
              </div>
            </Card>
          )}

          {relatedLinks && relatedLinks.length > 0 && (
            <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 mt-4 sm:mt-6 col-span-1 lg:col-span-2">
              <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-white">Relevant Links</h3>
              <div className="space-y-2 sm:space-y-3">
                {relatedLinks.map((l, i) => (
                  <a 
                    key={i} 
                    href={l.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="block px-3 sm:px-4 py-2 sm:py-3 rounded-lg border border-gray-700 hover:bg-gray-800 hover:border-purple-600/50 transition-all duration-200"
                  >
                    <span className="font-medium text-sm sm:text-base text-white block sm:inline">{l.title}</span>
                    <span className="ml-0 sm:ml-2 text-xs sm:text-sm text-gray-400 block sm:inline">({l.query})</span>
                  </a>
                ))}
              </div>
            </Card>
          )}
        </div>
        </div>
      </div>
    </Layout>
  );
};

export default GeneralKnowledge;