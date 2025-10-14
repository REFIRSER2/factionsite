import { useState, useRef, useEffect } from 'react';

interface AudioSettings {
  backgroundVolume: number;
  effectVolume: number;
  isMuted: boolean;
}

export const useAudio = () => {
  const [settings, setSettings] = useState<AudioSettings>({
    backgroundVolume: 0.3,
    effectVolume: 0.5,
    isMuted: false
  });

  const backgroundAudioRef = useRef<HTMLAudioElement | null>(null);
  const clickSoundRef = useRef<HTMLAudioElement | null>(null);
  const transitionSoundRef = useRef<HTMLAudioElement | null>(null);
  const backSoundRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // 배경음악 설정 (실제 프로젝트에서는 음악 파일 URL 사용)
    backgroundAudioRef.current = new Audio();
    backgroundAudioRef.current.loop = true;
    backgroundAudioRef.current.volume = settings.backgroundVolume;

    // 효과음 설정
    clickSoundRef.current = new Audio();
    clickSoundRef.current.volume = settings.effectVolume;

    transitionSoundRef.current = new Audio();
    transitionSoundRef.current.volume = settings.effectVolume;

    backSoundRef.current = new Audio();
    backSoundRef.current.volume = settings.effectVolume;

    return () => {
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
      }
    };
  }, []);

  useEffect(() => {
    if (backgroundAudioRef.current) {
      backgroundAudioRef.current.volume = settings.isMuted ? 0 : settings.backgroundVolume;
    }
    if (clickSoundRef.current) {
      clickSoundRef.current.volume = settings.isMuted ? 0 : settings.effectVolume;
    }
    if (transitionSoundRef.current) {
      transitionSoundRef.current.volume = settings.isMuted ? 0 : settings.effectVolume;
    }
    if (backSoundRef.current) {
      backSoundRef.current.volume = settings.isMuted ? 0 : settings.effectVolume;
    }
  }, [settings]);

  const playBackgroundMusic = () => {
    if (backgroundAudioRef.current && !settings.isMuted) {
      backgroundAudioRef.current.play().catch(() => {
        // 자동 재생 정책으로 인한 에러 무시
      });
    }
  };

  const playClickSound = () => {
    if (clickSoundRef.current && !settings.isMuted) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play().catch(() => {});
    }
  };

  const playTransitionSound = () => {
    if (transitionSoundRef.current && !settings.isMuted) {
      transitionSoundRef.current.currentTime = 0;
      transitionSoundRef.current.play().catch(() => {});
    }
  };

  const playBackSound = () => {
    if (backSoundRef.current && !settings.isMuted) {
      backSoundRef.current.currentTime = 0;
      backSoundRef.current.play().catch(() => {});
    }
  };

  const updateSettings = (newSettings: Partial<AudioSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
    playBackgroundMusic,
    playClickSound,
    playTransitionSound,
    playBackSound
  };
};