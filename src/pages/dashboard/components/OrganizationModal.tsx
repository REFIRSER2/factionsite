import { useNavigate } from 'react-router-dom';
import { Modal } from '../../../components/base/Modal';
import { Button } from '../../../components/base/Button';
import { useAudio } from '../../../hooks/useAudio';

interface OrganizationModalProps {
  organization: any;
  isOpen: boolean;
  onClose: () => void;
}

export const OrganizationModal = ({ organization, isOpen, onClose }: OrganizationModalProps) => {
  const navigate = useNavigate();
  const { playClickSound, playTransitionSound } = useAudio();

  if (!organization) return null;

  const handleNavigation = (path: string) => {
    playClickSound();
    playTransitionSound();
    onClose();
    navigate(path, { state: { organization } });
  };

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'friendly': return 'border-green-500';
      case 'hostile': return 'border-red-500';
      case 'neutral': return 'border-gray-500';
      default: return 'border-yellow-400';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className={`w-16 h-16 rounded-full overflow-hidden border-4 ${getRelationshipColor(organization.relationship)}`}>
              <img
                src={organization.logo}
                alt={organization.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white font-orbitron">
                {organization.name}
              </h2>
              <p className="text-gray-400">
                {organization.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        {/* 중앙 로고 */}
        <div className="flex justify-center mb-8">
          <div className={`w-32 h-32 rounded-full overflow-hidden border-4 ${getRelationshipColor(organization.relationship)} shadow-lg`}>
            <img
              src={organization.logo}
              alt={organization.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 네비게이션 버튼들 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 조직 정보 */}
          <Button
            onClick={() => handleNavigation('/organization-info')}
            className="h-24 flex-col space-y-2"
            variant="secondary"
          >
            <i className="ri-building-line text-2xl" />
            <span>조직 정보</span>
          </Button>

          {/* 조직원 정보 */}
          <Button
            onClick={() => handleNavigation('/members')}
            className="h-24 flex-col space-y-2"
            variant="secondary"
          >
            <i className="ri-team-line text-2xl" />
            <span>조직원 정보</span>
          </Button>

          {/* 조직 사업 */}
          <Button
            onClick={() => handleNavigation('/businesses')}
            className="h-24 flex-col space-y-2"
            variant="secondary"
          >
            <i className="ri-store-line text-2xl" />
            <span>조직 사업</span>
          </Button>

          {/* 증거 리스트 */}
          <Button
            onClick={() => handleNavigation('/evidence')}
            className="h-24 flex-col space-y-2"
            variant="secondary"
          >
            <i className="ri-file-list-line text-2xl" />
            <span>증거 리스트</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};