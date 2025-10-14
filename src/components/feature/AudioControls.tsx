import { useState } from 'react';
import { useAudio } from '../../hooks/useAudio';
import { Modal } from '../base/Modal';
import { Button } from '../base/Button';

export const AudioControls = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { settings, updateSettings } = useAudio();

  const handleVolumeChange = (type: 'background' | 'effect', value: number) => {
    if (type === 'background') {
      updateSettings({ backgroundVolume: value });
    } else {
      updateSettings({ effectVolume: value });
    }
  };

  const toggleMute = () => {
    updateSettings({ isMuted: !settings.isMuted });
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-30 p-3 bg-gray-900/80 border border-yellow-400/30 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/80 transition-all duration-200"
        title="소리 설정"
      >
        <i className={`ri-${settings.isMuted ? 'volume-mute' : 'volume-up'}-line text-lg`} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size="sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white font-orbitron">소리 설정</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <i className="ri-close-line text-xl" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 음소거 토글 */}
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">음소거</span>
              <button
                onClick={toggleMute}
                className={`
                  relative w-12 h-6 rounded-full transition-colors duration-200
                  ${settings.isMuted ? 'bg-gray-600' : 'bg-yellow-400'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200
                    ${settings.isMuted ? 'left-1' : 'left-7'}
                  `}
                />
              </button>
            </div>

            {/* 배경음악 볼륨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">배경음악</span>
                <span className="text-yellow-400 text-sm">
                  {Math.round(settings.backgroundVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.backgroundVolume}
                onChange={(e) => handleVolumeChange('background', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={settings.isMuted}
              />
            </div>

            {/* 효과음 볼륨 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium">효과음</span>
                <span className="text-yellow-400 text-sm">
                  {Math.round(settings.effectVolume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={settings.effectVolume}
                onChange={(e) => handleVolumeChange('effect', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={settings.isMuted}
              />
            </div>

            <div className="pt-4">
              <Button onClick={() => setIsOpen(false)} className="w-full">
                확인
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          border: 2px solid #000;
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #facc15;
          cursor: pointer;
          border: 2px solid #000;
        }
      `}</style>
    </>
  );
};