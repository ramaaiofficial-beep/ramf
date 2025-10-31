import { ReactNode, useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, User, Settings, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileForm } from "@/components/ProfileForm";
import { useVoice } from "@/contexts/VoiceContext";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
  showNav?: boolean;
}

export const Layout = ({ children, showNav = true }: LayoutProps) => {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { voiceSettings, setVoiceSettings } = useVoice();

  // Close profile menu when clicking outside
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
              {/* Left side navigation */}
              <div className="flex items-center space-x-8 cursor-pointer" onClick={() => navigate("/chat")}>
                <img
                  src="/RAMAAI.png"
                  alt="RAMA AI Logo"
                  className="h-28 w-auto" // Much bigger logo
                />
              </div>

              {/* Right side profile button */}
              <div className="relative" ref={menuRef}>
                <Button
                  variant="ghost"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="p-1 text-white"
                >
                  <User className="w-6 h-6" />
                </Button>

                {showProfileMenu && (
                  <div
                    className="absolute right-0 mt-2 w-80 bg-[#1e1e1e]/90 backdrop-blur-md rounded-lg shadow-xl z-50 flex flex-col border border-gray-800"
                  >
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
                        setShowVoiceSettings(!showVoiceSettings);
                      }}
                      className="text-white px-4 py-2 text-left hover:bg-black flex items-center transition"
                    >
                      {voiceSettings.enabled ? (
                        <Volume2 className="w-4 h-4 mr-2 text-green-400" />
                      ) : (
                        <VolumeX className="w-4 h-4 mr-2 text-gray-400" />
                      )}
                      Voice Settings
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

                    {/* Voice Settings Panel */}
                    {showVoiceSettings && (
                      <div className="px-4 py-3 border-t border-gray-700 bg-black/20">
                        <div className="space-y-3">
                          {/* Voice Enable/Disable */}
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">Voice Output</label>
                            <Button
                              onClick={() => setVoiceSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                              variant={voiceSettings.enabled ? "default" : "outline"}
                              size="sm"
                              className={cn(
                                "h-6 px-2 text-xs",
                                voiceSettings.enabled 
                                  ? "bg-green-600 hover:bg-green-700" 
                                  : "border-gray-600"
                              )}
                            >
                              {voiceSettings.enabled ? "On" : "Off"}
                            </Button>
                          </div>

                          {/* Voice Selection */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">Voice</label>
                            <select
                              value={voiceSettings.voice}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, voice: e.target.value }))}
                              className="w-full p-1 bg-black/50 border border-gray-700 rounded text-white text-xs"
                              disabled={!voiceSettings.enabled}
                            >
                              {speechSynthesis.getVoices().map((voice, index) => (
                                <option key={index} value={voice.name}>
                                  {voice.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Speed Control */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">
                              Speed: {voiceSettings.rate.toFixed(1)}x
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={voiceSettings.rate}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                              className="w-full h-1"
                              disabled={!voiceSettings.enabled}
                            />
                          </div>

                          {/* Pitch Control */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">
                              Pitch: {voiceSettings.pitch.toFixed(1)}
                            </label>
                            <input
                              type="range"
                              min="0.5"
                              max="2"
                              step="0.1"
                              value={voiceSettings.pitch}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, pitch: parseFloat(e.target.value) }))}
                              className="w-full h-1"
                              disabled={!voiceSettings.enabled}
                            />
                          </div>

                          {/* Volume Control */}
                          <div className="space-y-1">
                            <label className="text-xs font-medium text-gray-300">
                              Volume: {Math.round(voiceSettings.volume * 100)}%
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={voiceSettings.volume}
                              onChange={(e) => setVoiceSettings(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                              className="w-full h-1"
                              disabled={!voiceSettings.enabled}
                            />
                          </div>
                        </div>
                      </div>
                    )}
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
