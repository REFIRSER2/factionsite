
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '../../components/feature/Header';
import { AudioControls } from '../../components/feature/AudioControls';
import { LogoutButton } from '../../components/feature/LogoutButton';
import { organizations } from '../../mocks/organizations';
import { OrganizationModal } from './components/OrganizationModal';
import { useAudio } from '../../hooks/useAudio';

export default function DashboardPage() {
  const [selectedOrg, setSelectedOrg] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { playClickSound } = useAudio();

  const centerOrg = organizations.find(org => org.relationship === 'center');
  const otherOrgs = organizations.filter(org => org.relationship !== 'center');

  // 디버깅을 위해 조직 수 확인
  console.log('Total organizations:', organizations.length);
  console.log('Center org:', centerOrg?.name);
  console.log('Other orgs count:', otherOrgs.length);
  console.log('Other orgs:', otherOrgs.map(org => org.name));

  const handleOrgClick = (org: any) => {
    playClickSound();
    setSelectedOrg(org);
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'friendly': return 'border-green-500 shadow-green-500/25';
      case 'hostile': return 'border-red-500 shadow-red-500/25';
      case 'neutral': return 'border-gray-500 shadow-gray-500/25';
      default: return 'border-yellow-400 shadow-yellow-400/25';
    }
  };

  const getOrgPosition = (index: number, total: number) => {
    const angle = (index * 360) / total;
    const radius = 200;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { x, y };
  };

  return (
    <div className="min-h-screen bg-black">
      <Header currentPage="Organization Network" />
      
      {/* 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />

      <div className="relative z-10 pt-20 pb-8 px-4">
        {/* 통합 검색창 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md mx-auto mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="조직, 인물, 사업체 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-yellow-400/30 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-all duration-200"
            />
            <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400" />
          </div>
        </motion.div>

        {/* 조직 관계도 */}
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {/* 중심 조직 - Vitalle Family */}
            {centerOrg && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="z-10"
              >
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleOrgClick(centerOrg)}
                  className={`
                    w-28 h-28 rounded-full overflow-hidden border-4 ${getRelationshipColor(centerOrg.relationship)}
                    transition-all duration-300 hover:shadow-lg
                  `}
                >
                  <img
                    src={centerOrg.logo}
                    alt={centerOrg.name}
                    className="w-full h-full object-cover"
                  />
                </motion.button>
                <div className="text-center mt-3">
                  <div className="text-yellow-400 text-base font-medium font-orbitron">
                    {centerOrg.name}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 주변 조직들 - 8개 조직을 완벽한 원형으로 배치 */}
            {otherOrgs.map((org, index) => {
              const position = getOrgPosition(index, otherOrgs.length); // 실제 조직 수로 계산
              return (
                <motion.div
                  key={org.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, type: "spring", stiffness: 200 }}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${position.x}px - 56px)`,
                    top: `calc(50% + ${position.y}px - 56px)`,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrgClick(org)}
                    className={`
                      w-28 h-28 rounded-full overflow-hidden border-4 ${getRelationshipColor(org.relationship)}
                      transition-all duration-300 hover:shadow-lg
                    `}
                  >
                    <img
                      src={org.logo}
                      alt={org.name}
                      className="w-full h-full object-cover"
                    />
                  </motion.button>
                  
                  <div className="text-center mt-3">
                    <div className="text-white text-sm font-medium">
                      {org.name}
                    </div>
                    <div className={`text-sm ${
                      org.relationship === 'friendly' ? 'text-green-400' :
                      org.relationship === 'hostile' ? 'text-red-400' :
                      'text-gray-400'
                    }`}>
                      {org.relationship === 'friendly' ? '우호' :
                       org.relationship === 'hostile' ? '적대' : '중립'}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* 디버깅 정보 표시 (개발용) */}
        <div className="text-center mt-4 text-gray-500 text-sm">
          총 조직 수: {organizations.length} | 중심 조직: 1개 | 주변 조직: {otherOrgs.length}개
        </div>
      </div>

      {/* 조직 상세 모달 */}
      <OrganizationModal
        organization={selectedOrg}
        isOpen={!!selectedOrg}
        onClose={() => setSelectedOrg(null)}
      />

      <AudioControls />
      <LogoutButton />
    </div>
  );
}
