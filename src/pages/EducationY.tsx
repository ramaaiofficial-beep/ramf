import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Search, Send, Mic, Sparkles } from "lucide-react";
import { OmIcon } from "./Younger";
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
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/younger")}
            className="mr-4 text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
          >
            <ArrowLeft className="w-5 h-5 mr-2" /> Back
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-white flex items-center gap-2"><OmIcon size={24} color="#a78bfa" /> Spiritual Hub</h1>
            <p className="text-gray-400 mt-2">A sacred space where Dharma meets AI wisdom</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Spiritual Texts */}
          <Card className="p-6 bg-[#1e1e1e] border border-gray-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Spiritual Texts</h2>
              <Button onClick={handleFileUpload} className="bg-gray-700 hover:bg-gray-600">
                <Upload className="w-4 h-4 mr-2" /> Upload
              </Button>
            </div>

            <input ref={fileInputRef} type="file" accept=".pdf,image/*" onChange={handleFileChange} className="hidden" />

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search texts..."
                className="pl-10 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
              />
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredDocuments.map(doc => (
                <div key={doc.id} onClick={() => setCurrentFile(doc.name)} className="p-4 bg-[#1e1e1e] rounded-lg border border-gray-700 hover:bg-gray-800 cursor-pointer">
                  <h3 className="font-semibold text-white mb-2">{doc.name}</h3>
                  <div className="flex justify-between items-center text-sm text-gray-400">
                    <span className="px-2 py-1 bg-gray-700 rounded-md">{doc.category}</span>
                    <span>{doc.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Assistant */}
          <Card className="p-6 bg-[#1e1e1e] border border-gray-800 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400" /> Dharma AI</h2>
              <span className="text-purple-300">Online</span>
            </div>

            <div className="flex-1 space-y-4 mb-6 max-h-96 overflow-y-auto">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${msg.type === 'user' ? 'bg-gray-700 text-white' : 'bg-[#1e1e1e] text-white'}`}>
                    {msg.type === 'assistant' ? renderStructuredContent(msg.content) : <p className="text-sm leading-relaxed">{msg.content}</p>}
                    <p className="text-xs opacity-60 mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            {currentFile && (
              <div className="flex flex-wrap gap-2 mb-3">
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`Summarize the uploaded text "${currentFile}" in a devotional, student-friendly way.`)}>Summarize</Button>
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={() => handleSendMessage(`List the key teachings and takeaways from "${currentFile}" as clean bullet points.`)}>Key Points</Button>
                <Button size="sm" className="bg-gray-700 hover:bg-gray-600" onClick={async () => {
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
                }}>Relevant Links</Button>
              </div>
            )}

            {/* Message Input */}
            <div className="flex items-center gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#1e1e1e] border border-gray-800 text-white placeholder-gray-400"
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <Button onClick={() => handleSendMessage()} className="bg-gray-700 hover:bg-gray-600">
                <Send className="w-4 h-4" />
              </Button>
              <Button variant="ghost" className="text-gray-400 hover:text-white">
                <Mic className="w-4 h-4" />
              </Button>
            </div>
          </Card>
          {relatedLinks && relatedLinks.length > 0 && (
            <Card className="p-6 bg-[#1e1e1e] border border-gray-800 mt-6 col-span-1 lg:col-span-2">
              <h3 className="text-xl font-semibold mb-4">Relevant Links</h3>
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

export default SpiritualHub;
