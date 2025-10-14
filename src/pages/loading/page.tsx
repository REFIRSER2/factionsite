
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAudio } from '../../hooks/useAudio';

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);
  const [showWelcome, setShowWelcome] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { playBackgroundMusic, playTransitionSound } = useAudio();

  useEffect(() => {
    const userData = localStorage.getItem('vitalle-user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    // 배경음악 시작
    playBackgroundMusic();

    // 랜덤 로딩 시간 (3-5초)
    const loadingTime = Math.random() * 2000 + 3000; // 3000ms ~ 5000ms
    const startTime = Date.now();

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / loadingTime) * 100, 100);
      
      setProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(progressInterval);
        setTimeout(() => {
          setShowWelcome(true);
          playTransitionSound();
          
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        }, 500);
      }
    }, 50); // 50ms마다 업데이트로 더 부드럽게

    return () => clearInterval(progressInterval);
  }, [navigate, playBackgroundMusic, playTransitionSound]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />

      <div className="relative z-10 w-full max-w-md text-center">
        {!showWelcome ? (
          /* 로딩 화면 */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8"
          >
            {/* 로딩 바 */}
            <div className="space-y-4">
              <div className="text-yellow-400 text-lg font-orbitron">
                시스템 초기화 중...
              </div>
              
              <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden border border-gray-700">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1, ease: "easeOut" }}
                />
              </div>
              
              <div className="text-yellow-400/70 text-sm font-mono">
                {Math.round(progress)}%
              </div>
            </div>

            {/* 로딩 상태 텍스트 */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-gray-400 text-sm space-y-1"
            >
              <div>보안 프로토콜 확인 중...</div>
              <div>데이터베이스 연결 중...</div>
              <div>사용자 권한 검증 중...</div>
            </motion.div>
          </motion.div>
        ) : (
          /* 환영 화면 */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="space-y-6"
          >
            {/* 프로필 이미지 */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-yellow-400 shadow-lg shadow-yellow-400/25"
            >
              <img
                src={user?.profileImage}
                alt={user?.name}
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* 환영 메시지 */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <h1 className="text-3xl font-bold text-white font-orbitron">
                Welcome Back,
              </h1>
              <h2 className="text-2xl font-semibold text-yellow-400">
                {user?.name}
              </h2>
            </motion.div>

            {/* 로딩 인디케이터 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex justify-center space-x-1"
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-yellow-400 rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}