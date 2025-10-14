import { useEffect, useState } from 'react';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  currentPage: string;
}

export const Header = ({ currentPage }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const timeString = date.toLocaleTimeString('ko-KR', { 
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `${timeString} | ${dateString}`;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black/90 backdrop-blur-md border-b border-yellow-400/20">
      <div className="flex items-center justify-between px-6 py-4">
        {/* 좌측 상단 - 시스템 이름 */}
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400 text-lg">🔱</span>
          <span className="text-yellow-400 text-sm font-medium font-orbitron">
            Vitalle Family Intranet System
          </span>
        </div>

        {/* 중앙 - 현재 페이지명 */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-white text-xl font-semibold font-orbitron">
            {currentPage}
          </h1>
        </div>

        {/* 우측 상단 - 시간 표시 및 테마 토글 */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 text-yellow-400 hover:text-yellow-300 transition-colors"
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            <i className={`ri-${theme === 'dark' ? 'sun' : 'moon'}-line text-lg`} />
          </button>
          <div className="text-yellow-400 text-sm font-mono font-medium">
            {formatTime(currentTime)}
          </div>
        </div>
      </div>
    </header>
  );
};