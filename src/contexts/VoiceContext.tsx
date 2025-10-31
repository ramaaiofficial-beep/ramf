import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface VoiceSettings {
  enabled: boolean;
  rate: number;
  pitch: number;
  volume: number;
  voice: string;
}

interface VoiceContextType {
  voiceSettings: VoiceSettings;
  setVoiceSettings: React.Dispatch<React.SetStateAction<VoiceSettings>>;
}

const VoiceContext = createContext<VoiceContextType | undefined>(undefined);

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    enabled: true,
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8,
    voice: "",
  });

  // Initialize voice settings on component mount
  useEffect(() => {
    const voices = speechSynthesis.getVoices();
    if (voices.length > 0 && !voiceSettings.voice) {
      // Try to find a natural-sounding voice
      const preferredVoice = voices.find(voice => 
        voice.name.includes('Google') || 
        voice.name.includes('Microsoft') ||
        voice.name.includes('Natural')
      ) || voices[0];
      
      setVoiceSettings(prev => ({
        ...prev,
        voice: preferredVoice.name
      }));
    }
  }, []);

  return (
    <VoiceContext.Provider value={{ voiceSettings, setVoiceSettings }}>
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = () => {
  const context = useContext(VoiceContext);
  if (context === undefined) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
