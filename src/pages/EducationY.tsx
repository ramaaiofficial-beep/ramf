import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Search, Send, Mic, Sparkles } from "lucide-react";
import { OmIcon } from "./Younger";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/Layout";
import { API_URL } from "@/config/api";

interface Document {
  id: string;
  name: string;
  category: string;
  date: string;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface LinkItem { title: string; query: string; url: string }

// formatter for headings and bullets
const renderStructuredContent = (content: string) => {
  const lines = content.split(/\r?\n/).map(l => l.trim());
  const elements: JSX.Element[] = [];
  let list: string[] = [];
  const flush = () => {
    if (!list.length) return;
    elements.push(
      <ul className="list-disc pl-5 space-y-1" key={`ul-${elements.length}`}>
        {list.map((it, i) => (
          <li key={i} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: it }} />
        ))}
      </ul>
    );
    list = [];
  };
  const inline = (t: string) => t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  lines.forEach((raw, idx) => {
    const line = raw.trim();
    if (!line) { flush(); return; }
    if (/^[*-]\s+/.test(line)) { list.push(inline(line.replace(/^[*-]\s+/, ''))); return; }
    if (/[^:]+:\s*$/.test(line)) { flush(); elements.push(<div key={`h-${idx}`} className="mt-3 mb-1 font-semibold">{line.replace(/:$/, '')}</div>); return; }
    flush(); elements.push(<p key={`p-${idx}`} className="text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: inline(line) }} />);
  });
  flush();
  return <div className="space-y-2">{elements}</div>;
};

const SpiritualHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content: "Welcome to the Spiritual Hub — a sacred digital space where stories of Dharma meet the wisdom of AI. Upload a spiritual PDF or image, and ask anything. I can summarize teachings, list key points, or reflect on meanings.",
      timestamp: "10:35 am"
    }
  ]);

  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [relatedLinks, setRelatedLinks] = useState<LinkItem[] | null>(null);

  const handleFileUpload = () => fileInputRef.current?.click();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      toast({ title: "Error", description: "Upload a PDF or image (jpg/png/webp)", variant: "destructive" });
      return;
    }
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_URL}/educationy/upload/docs`, { method: "POST", headers, body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      const newDoc: Document = {
        id: Date.now().toString(),
        name: file.name,
        category: "Spiritual",
        date: new Date().toLocaleDateString("en-GB")
      };
      setDocuments(prev => [newDoc, ...prev]);
      setCurrentFile(file.name);
      toast({ title: "Uploaded", description: data.message || "File uploaded" });
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "assistant",
          content: `I've received your text "${file.name}".\n\n**What would you like me to do?**\n- Summarize it\n- List key points\n- Offer a reflection\n- Show relevant links`,
          timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } catch {
      toast({ title: "Error", description: "Failed to upload file", variant: "destructive" });
    }
  };

  const handleSendMessage = async (custom?: string) => {
    const text = custom || messageInput;
    if (!text.trim()) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };
    setMessages(prev => [...prev, userMessage]);
    setMessageInput("");
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const url = `${API_URL}/educationy/ask${currentFile ? `?filename=${encodeURIComponent(currentFile)}` : ""}`;
      const res = await fetch(url, { method: "POST", headers, body: JSON.stringify({ question: text }) });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const ai: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: data.answer || "Sorry, I couldn't find an answer.",
        timestamp: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => [...prev, ai]);
    } catch {
      setMessages(prev => [
        ...prev,
        { id: (Date.now() + 2).toString(), type: "assistant", content: "Failed to connect to the server.", timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
      ]);
    }
  };

  const filteredDocuments = documents.filter(doc =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout showNav>
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/younger")}
            className="text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" /> Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2 flex-wrap">
              <OmIcon size={24} color="#a78bfa" /> 
              <span className="whitespace-nowrap">Spiritual Hub</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-2">A sacred space where Dharma meets AI wisdom</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
          {/* Spiritual Texts */}
          <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white">Spiritual Texts</h2>
              <Button 
                onClick={handleFileUpload} 
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition shadow-lg"
                size="sm"
              >
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search texts..."
                className="pl-9 sm:pl-10 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10"
              />
            </div>

            <div className="space-y-3 sm:space-y-4 max-h-[400px] sm:max-h-96 overflow-y-auto">
              {filteredDocuments.length === 0 ? (
                <div className="text-center py-8 px-4">
                  <Sparkles className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">
                    {searchQuery ? "No texts found" : "No spiritual texts uploaded yet"}
                  </p>
                  {!searchQuery && (
                    <Button
                      onClick={handleFileUpload}
                      className="mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                      size="sm"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload First Text
                    </Button>
                  )}
                </div>
              ) : (
                filteredDocuments.map(doc => (
                  <div 
                    key={doc.id} 
                    onClick={() => setCurrentFile(doc.name)} 
                    className={`p-3 sm:p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      currentFile === doc.name
                        ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-purple-600 shadow-lg"
                        : "bg-[#131313] border-gray-700 hover:bg-[#1e1e1e] hover:border-gray-600"
                    }`}
                  >
                    <h3 className="font-semibold text-white text-sm sm:text-base mb-2 truncate">{doc.name}</h3>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs sm:text-sm text-gray-400">
                      <span className="px-2 py-1 bg-gray-700 rounded-md">{doc.category}</span>
                      <span>{doc.date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* AI Assistant */}
          <Card className="p-4 sm:p-6 bg-[#1e1e1e] border border-gray-800 flex flex-col space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
              <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> 
                <span>Dharma AI</span>
              </h2>
              <span className="text-xs sm:text-sm px-3 py-1 bg-green-600/20 border border-green-600/50 text-green-400 rounded-full font-semibold">Online</span>
            </div>

            <div className="flex-1 space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-[400px] sm:max-h-96 overflow-y-auto p-2">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                    msg.type === 'user' 
                      ? 'bg-gradient-to-r from-purple-600/80 to-blue-600/80 text-white' 
                      : 'bg-[#131313] border border-gray-800 text-white'
                  }`}>
                    {msg.type === 'assistant' ? (
                      <div className="text-sm sm:text-base">
                        {renderStructuredContent(msg.content)}
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed">{msg.content}</p>
                    )}
                    <p className="text-xs opacity-60 mt-2 text-right">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {currentFile && (
              <div className="flex flex-wrap gap-2 mb-3 sm:mb-4">
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm" 
                  onClick={() => handleSendMessage(`Summarize the uploaded text "${currentFile}" in a devotional, student-friendly way.`)}
                >
                  Summarize
                </Button>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition text-xs sm:text-sm" 
                  onClick={() => handleSendMessage(`List the key teachings and takeaways from "${currentFile}" as clean bullet points.`)}
                >
                  Key Points
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
                      const res = await fetch(`${API_URL}/educationy/links?filename=${encodeURIComponent(currentFile)}&num=5`, { headers });
                      const data = await res.json();
                      const links = (data.links || []) as LinkItem[];
                      if (!links.length) { toast({ title: 'No links found', description: 'Try another text' }); return; }
                      setRelatedLinks(links);
                    } catch {
                      toast({ title: 'Error', description: 'Failed to fetch links', variant: 'destructive' });
                    }
                  }}
                >
                  Relevant Links
                </Button>
              </div>
            )}

            {/* Message Input */}
            <div className="flex items-center gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button 
                onClick={() => handleSendMessage()} 
                className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                size="sm"
              >
                <Send className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                className="text-gray-400 hover:text-purple-400 transition"
                size="sm"
              >
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </Card>
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

export default SpiritualHub;
