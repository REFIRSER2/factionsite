import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Input } from '../../components/base/Input';
import { Button } from '../../components/base/Button';
import { users } from '../../mocks/users';
import { useAudio } from '../../hooks/useAudio';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ id: '', password: '' });
  const [status, setStatus] = useState<'idle' | 'error' | 'success'>('idle');
  const [failCount, setFailCount] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [shake, setShake] = useState(false);
  const navigate = useNavigate();
  const { playClickSound, playTransitionSound } = useAudio();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prev => prev - 1);
      }, 1000);
    } else if (isLocked && lockTimer === 0) {
      setIsLocked(false);
      setFailCount(0);
    }
    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    playClickSound();

    if (isLocked) return;

    const user = users.find(u => u.id === credentials.id && u.password === credentials.password);

    if (user) {
      setStatus('success');
      playTransitionSound();
      localStorage.setItem('vitalle-user', JSON.stringify(user));
      
      setTimeout(() => {
        navigate('/loading');
      }, 2000);
    } else {
      setStatus('error');
      setShake(true);
      const newFailCount = failCount + 1;
      setFailCount(newFailCount);

      if (newFailCount >= 3) {
        setIsLocked(true);
        setLockTimer(30);
      }

      setTimeout(() => {
        setShake(false);
        if (newFailCount < 3) {
          setStatus('idle');
        }
      }, 2000);
    }
  };

  const getStatusMessage = () => {
    if (isLocked) {
      return (
        <div className="text-center space-y-2">
          <div className="text-red-500 font-bold text-lg animate-pulse">
            🚨 SYSTEM LOCKDOWN 🚨
          </div>
          <div className="text-red-400 text-sm">
            SECURITY PROTOCOL ENGAGED
          </div>
          <div className="text-red-300 text-xs">
            재시도까지: {lockTimer}초
          </div>
        </div>
      );
    }

    switch (status) {
      case 'error':
        return (
          <div className="text-red-500 font-semibold animate-pulse">
            ACCESS DENIED
          </div>
        );
      case 'success':
        return (
          <div className="text-green-500 font-semibold animate-pulse">
            ACCESS PERMITTED
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen bg-black flex items-center justify-center p-4 ${isLocked ? 'bg-red-900/20' : ''}`}>
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />
      
      {/* 로그인 폼 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          x: shake ? [-10, 10, -10, 10, 0] : 0
        }}
        transition={{ duration: 0.6 }}
        className={`
          relative z-10 w-full max-w-md p-8 bg-gray-900/80 backdrop-blur-md 
          border border-yellow-400/30 rounded-2xl shadow-2xl
          ${isLocked ? 'border-red-500 shadow-red-500/20' : ''}
        `}
      >
        {/* 로고 */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center"
          >
            <span className="text-black text-3xl font-bold">🔱</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-white font-orbitron">
            Vitalle Family
          </h1>
          <p className="text-yellow-400 text-sm font-medium">
            Intranet System
          </p>
        </div>

        {/* 로그인 폼 */}
        <form onSubmit={handleLogin} className="space-y-6">
          <Input
            type="text"
            placeholder="사용자 ID"
            value={credentials.id}
            onChange={(e) => setCredentials(prev => ({ ...prev, id: e.target.value }))}
            disabled={isLocked}
            className={isLocked ? 'opacity-50' : ''}
          />
          
          <Input
            type="password"
            placeholder="비밀번호"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            disabled={isLocked}
            className={isLocked ? 'opacity-50' : ''}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLocked || !credentials.id || !credentials.password}
            isLoading={status === 'success'}
          >
            {status === 'success' ? '접속 중...' : '로그인'}
          </Button>
        </form>

        {/* 상태 메시지 */}
        <div className="mt-6 text-center min-h-[60px] flex items-center justify-center">
          {getStatusMessage()}
        </div>

        {/* 실패 횟수 표시 */}
        {failCount > 0 && !isLocked && (
          <div className="text-center text-yellow-400 text-xs">
            로그인 실패: {failCount}/3
          </div>
        )}
      </motion.div>

      {/* 잠금 상태 배경 효과 */}
      {isLocked && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-red-500/10 pointer-events-none"
        />
      )}
    </div>
  );
}