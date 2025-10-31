import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Music,
  Upload,
  Trash2,
  Search,
  Folder,
  FolderOpen,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { API_URL } from "@/config/api";

// 🎵 Song interface
interface Song {
  name: string;
  url: string;
}

// 🎧 SongPage
const SongPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <Layout showNav>
      <div className="min-h-screen bg-black text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 via-black to-blue-900/30 blur-3xl opacity-40 pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 relative z-10">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/elders")}
              className="text-gray-400 hover:text-white hover:bg-[#1e1e1e]"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Back
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white flex items-center gap-2">
                <Music className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                Songs Explorer
              </h1>
              <p className="text-sm sm:text-base text-gray-400 mt-2">
                Upload and manage your favorite songs
              </p>
            </div>
          </div>

          {/* Mobile Sidebar Toggle */}
          {!sidebarOpen && (
            <Button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden mb-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 shadow-xl transition-all duration-200"
            >
              <Menu className="w-4 h-4 mr-2" />
              Show Songs List
            </Button>
          )}

          {/* Mobile Overlay */}
          {sidebarOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-20"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 w-full overflow-hidden">
            {/* Left Sidebar - Songs List */}
            <Card
              className={`lg:w-72 bg-[#1e1e1e] border border-gray-800 p-4 sm:p-6 flex flex-col ${
                sidebarOpen
                  ? "fixed inset-y-0 left-0 z-30 w-72 shadow-2xl"
                  : "hidden lg:flex"
              }`}
            >
              {sidebarOpen && (
                <Button
                  variant="ghost"
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden mb-4 self-end text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}

              {/* Upload */}
              <div className="space-y-2 mb-4">
                <Input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="text-sm bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition"
                />
                <Button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:opacity-90 transition"
                  size="sm"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {loading ? "Uploading..." : "Upload Song"}
                </Button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search song..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 sm:pl-10 bg-[#131313] border border-gray-800 text-white placeholder-gray-400 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 transition text-sm h-9 sm:h-10"
                />
              </div>

              {/* Folder View */}
              <div>
                <div
                  onClick={() => setFolderOpen(!folderOpen)}
                  className="flex items-center gap-2 cursor-pointer px-2 py-2 hover:bg-[#131313] rounded transition"
                >
                  {folderOpen ? (
                    <FolderOpen className="text-purple-400 w-5 h-5" />
                  ) : (
                    <Folder className="text-purple-400 w-5 h-5" />
                  )}
                  <span className="text-sm text-white font-medium">Songs ({songs.length})</span>
                </div>

                {folderOpen && (
                  <div className="pl-6 mt-2 space-y-2 max-h-[400px] sm:max-h-96 overflow-y-auto">
                    {filteredSongs.length === 0 ? (
                      <p className="text-gray-400 text-sm mt-2 py-4 text-center">No songs found.</p>
                    ) : (
                      filteredSongs.map((song) => (
                        <div
                          key={song.name}
                          className={`flex justify-between items-center py-2 px-3 rounded-lg cursor-pointer transition-all duration-200 ${
                            selectedSong?.name === song.name
                              ? "bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-600 shadow-lg"
                              : "bg-[#131313] border border-gray-800 hover:bg-[#1e1e1e] hover:border-gray-600"
                          }`}
                          onClick={() => {
                            handleSongSelect(song);
                            if (window.innerWidth < 1024) {
                              setSidebarOpen(false);
                            }
                          }}
                        >
                          <span className="truncate text-white text-sm flex-1">{song.name}</span>
                          <Trash2
                            size={16}
                            className="text-red-400 hover:text-red-500 ml-2 flex-shrink-0"
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
            </Card>

            {/* Right Panel - Audio Player */}
            <div className="flex-1 min-w-0 w-full overflow-hidden">
              {selectedSong ? (
                <Card className="bg-[#1e1e1e] border border-gray-800 p-4 sm:p-6 w-full">
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 sm:mb-6 text-white flex items-start gap-2 w-full overflow-hidden">
                    <Music className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400 flex-shrink-0 mt-1" />
                    <span className="break-words break-all min-w-0 flex-1 overflow-hidden" style={{ wordBreak: 'break-all', overflowWrap: 'anywhere' }}>{selectedSong.name}</span>
                  </h2>
                  <div className="bg-[#131313] border border-gray-800 rounded-lg p-4 sm:p-6 w-full overflow-hidden">
                    <audio controls className="w-full max-w-full">
                      <source src={selectedSong.url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                </Card>
              ) : (
                <Card className="bg-[#1e1e1e] border border-gray-800 p-8 sm:p-12 text-center">
                  <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-sm sm:text-base">
                    Select a song from the list to play it
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SongPage;
