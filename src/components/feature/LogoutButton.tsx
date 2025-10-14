import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../base/Modal';
import { Button } from '../base/Button';
import { useAudio } from '../../hooks/useAudio';

export const LogoutButton = () => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const { playClickSound, playTransitionSound } = useAudio();

  const handleLogout = () => {
    playClickSound();
    setIsConfirmOpen(true);
  };

  const confirmLogout = async () => {
    playTransitionSound();
    setIsLoggingOut(true);
    
    // 가짜 로그아웃 연출
    setTimeout(() => {
      localStorage.removeItem('vitalle-user');
      navigate('/');
      setIsLoggingOut(false);
      setIsConfirmOpen(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={handleLogout}
        className="fixed bottom-4 right-20 z-30 p-3 bg-gray-900/80 border border-yellow-400/30 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/80 transition-all duration-200"
        title="로그아웃"
      >
        <i className="ri-logout-box-line text-lg" />
      </button>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} size="sm">
        <div className="p-6">
          <div className="text-center">
            <div className="mb-4">
              <i className="ri-question-line text-4xl text-yellow-400" />
            </div>
            <h2 className="text-xl font-semibold text-white mb-2 font-orbitron">
              로그아웃 확인
            </h2>
            <p className="text-gray-300 mb-6">
              정말로 로그아웃 하시겠습니까?
            </p>

            {isLoggingOut ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-2 text-yellow-400">
                  <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                  <span>시스템에서 로그아웃 중...</span>
                </div>
                <div className="text-sm text-gray-400">
                  보안 프로토콜 실행 중
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <Button
                  variant="secondary"
                  onClick={() => setIsConfirmOpen(false)}
                  className="flex-1"
                >
                  취소
                </Button>
                <Button
                  variant="danger"
                  onClick={confirmLogout}
                  className="flex-1"
                >
                  로그아웃
                </Button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};