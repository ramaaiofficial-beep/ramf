import React, { useEffect, useState, useRef, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Music,
  Upload,
  Trash2,
  Search,
  LogOut,
  User,
  Settings,
  Folder,
  FolderOpen,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "@/components/ProfileForm";
import { API_URL } from "@/config/api";

// 🎵 Song interface
interface Song {
  name: string;
  url: string;
}

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

// 🧭 Layout
const Layout = ({ children, showNav = true }: LayoutProps) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white relative">
      {showNav && (
        <nav className="border-b border-gray-800 bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div
                className="flex items-center space-x-8 cursor-pointer"
                onClick={() => navigate("/chat")}
              >
                <img src="/RAMAAI.png" alt="RAMA AI Logo" className="h-28 w-auto" />
              </div>

              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-1 text-white"
                >
                  <User className="w-6 h-6" />
                </Button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-44 bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg shadow-xl z-50 flex flex-col border border-gray-800">
                    <button
                      onClick={() => {
                        setShowProfileForm(true);
                        setShowProfileMenu(false);
                      }}
                      className="text-white px-4 py-2 text-left hover:bg-black transition"
                    >
                      Edit Profile
                    </button>

                    <button
                      onClick={() => {
                        navigate("/manage-profile");
                        setShowProfileMenu(false);
                      }}
                      className="text-white px-4 py-2 text-left hover:bg-black flex items-center transition"
                    >
                      <Settings className="w-4 h-4 mr-2 text-purple-400" />
                      Manage Profile
                    </button>

                    <button
                      onClick={() => {
                        sessionStorage.removeItem("token");
                        navigate("/");
                      }}
                      className="text-white px-4 py-2 text-left hover:bg-black flex items-center transition"
                    >
                      <LogOut className="w-4 h-4 mr-2 text-red-400" />
                      Logout
                    </button>
                  </div>
                )}

                {showProfileForm && (
                  <ProfileForm onClose={() => setShowProfileForm(false)} />
                )}
              </div>
            </div>
          </div>
        </nav>
      )}
      <div className="bg-black">{children}</div>
    </div>
  );
};

// 🎧 SongPage
const SongPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);

  const navigate = useNavigate();
  const API_BASE = `${API_URL}/api/songs`;

  const fetchSongs = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setSongs(data.songs || []);
    } catch (err) {
      console.error("Error fetching songs:", err);
    }
  };

  useEffect(() => {
    fetchSongs();
  }, []);

  const handleUpload = async () => {
    if (!file) return alert("Please select a song file first.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      alert(data.message || "✅ Upload successful!");
      fetchSongs();
      setFile(null);
    } catch {
      alert("Upload failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (songName: string) => {
    const confirmDelete = window.confirm(`Are you sure you want to delete "${songName}"?`);
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${API_BASE}/${songName}`, { method: "DELETE" });
      const data = await res.json();
      alert(data.message);
      fetchSongs();
      setSelectedSong(null);
    } catch {
      alert("Delete failed!");
    }
  };

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
  };

  const filteredSongs = songs.filter((song) =>
    song.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout showNav={true}>
      <div className="flex h-[calc(100vh-4rem)] bg-[#1e1e1e] text-white">
        {/* Left Sidebar */}
        <div className="w-72 bg-[#252526] border-r border-[#333] p-4 flex flex-col">
          <Button
            onClick={() => navigate("/elders")}
            className="mb-4 bg-gray-700 hover:bg-gray-600 text-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center mb-4">
            <Music className="mr-2 text-blue-400" />
            <h1 className="text-lg font-semibold">Songs Explorer</h1>
          </div>

          {/* Upload */}
          <div className="space-y-2 mb-4">
            <Input
              type="file"
              accept="audio/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="text-sm text-gray-300 bg-[#1e1e1e] border-[#333]"
            />
            <Button
              onClick={handleUpload}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? "Uploading..." : "Upload Song"}
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 mb-3">
            <Search className="text-gray-400" size={16} />
            <Input
              placeholder="Search song..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm bg-[#1e1e1e] border-[#333] text-gray-300"
            />
          </div>

          {/* Folder View */}
          <div>
            <div
              onClick={() => setFolderOpen(!folderOpen)}
              className="flex items-center gap-2 cursor-pointer px-2 py-1 hover:bg-[#2d2d2d] rounded"
            >
              {folderOpen ? (
                <FolderOpen className="text-yellow-400" size={18} />
              ) : (
                <Folder className="text-yellow-400" size={18} />
              )}
              <span className="text-sm text-gray-200">Songs</span>
            </div>

            {folderOpen && (
              <div className="pl-6 mt-2 space-y-1 max-h-64 overflow-y-auto">
                {filteredSongs.length === 0 ? (
                  <p className="text-gray-400 text-sm mt-2">No songs found.</p>
                ) : (
                  filteredSongs.map((song) => (
                    <div
                      key={song.name}
                      className="flex justify-between items-center py-1 px-2 rounded hover:bg-[#2d2d2d] cursor-pointer"
                      onClick={() => handleSongSelect(song)}
                    >
                      <span className="truncate text-gray-200 text-sm">{song.name}</span>
                      <Trash2
                        size={16}
                        className="text-red-400 hover:text-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(song.name);
                        }}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-3">Total Songs: {songs.length}</p>
        </div>

        {/* Right Panel */}
        <div className="flex-1 bg-[#1e1e1e] p-8 overflow-y-auto">
          {selectedSong ? (
            <>
              <h2 className="text-xl font-semibold mb-6 text-blue-400">🎧 {selectedSong.name}</h2>
              <Card className="bg-[#2d2d2d] p-4 mb-6">
                <audio controls className="w-full">
                  <source src={selectedSong.url} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </Card>
            </>
          ) : (
            <p className="text-gray-500 text-sm">Select a song from the left to play it.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default SongPage;
