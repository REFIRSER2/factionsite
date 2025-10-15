import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Header } from '../../components/feature/Header'
import { AudioControls } from '../../components/feature/AudioControls'
import { LogoutButton } from '../../components/feature/LogoutButton'
import { OrganizationModal } from './components/OrganizationModal'
import { useAudio } from '../../hooks/useAudio'
import { useOrganizationData } from '../../context/OrganizationDataContext'
import { ManagementMenu } from '../../components/feature/ManagementMenu'

const RELATIONSHIP_LABEL: Record<string, string> = {
  friendly: '우호',
  hostile: '적대',
  neutral: '중립',
}

const relationshipColor = (relationship: string) => {
  switch (relationship) {
    case 'friendly':
      return 'border-green-500 shadow-green-500/25'
    case 'hostile':
      return 'border-red-500 shadow-red-500/25'
    case 'neutral':
      return 'border-gray-500 shadow-gray-500/25'
    default:
      return 'border-yellow-400 shadow-yellow-400/25'
  }
}

const polarCoordinate = (index: number, total: number) => {
  const angle = (index * 360) / total
  const radius = 200
  const x = Math.cos((angle * Math.PI) / 180) * radius
  const y = Math.sin((angle * Math.PI) / 180) * radius
  return { x, y }
}

export default function DashboardPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const { playClickSound } = useAudio()
  const { data } = useOrganizationData()

  const centerOrg = useMemo(
    () => data.organizations.find((organization) => organization.relationship === 'center'),
    [data.organizations]
  )
  const otherOrgs = useMemo(
    () => data.organizations.filter((organization) => organization.relationship !== 'center'),
    [data.organizations]
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const highlightedOrganizations = useMemo(() => {
    if (!normalizedQuery) {
      return new Set(otherOrgs.map((organization) => organization.id))
    }
    return new Set(
      otherOrgs
        .filter((organization) => {
          const target = `${organization.name} ${organization.location} ${organization.description}`.toLowerCase()
          return target.includes(normalizedQuery)
        })
        .map((organization) => organization.id)
    )
  }, [otherOrgs, normalizedQuery])

  const handleOrgClick = (organizationId: string) => {
    if (normalizedQuery && !highlightedOrganizations.has(organizationId)) {
      return
    }
    playClickSound()
    setSelectedOrgId(organizationId)
  }

  return (
    <div className="min-h-screen bg-black">
      <Header currentPage="Organization Network" />

      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]" />

      <div className="relative z-10 pt-20 pb-8 px-4">
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
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full px-4 py-3 pl-12 bg-gray-900/50 border border-yellow-400/30 rounded-lg text-white placeholder-gray-400 text-sm focus:outline-none focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400/50 transition-all duration-200"
            />
            <i className="ri-search-line absolute left-4 top-1/2 transform -translate-y-1/2 text-yellow-400" />
          </div>
          {normalizedQuery && highlightedOrganizations.size === 0 && (
            <p className="mt-3 text-xs text-red-400 text-center">
              검색과 일치하는 조직이 없습니다.
            </p>
          )}
        </motion.div>

        <div className="flex items-center justify-center min-h-[600px]">
          <div className="relative w-[500px] h-[500px] flex items-center justify-center">
            {centerOrg && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="z-10"
              >
                <div
                  className={`
                    w-28 h-28 rounded-full overflow-hidden border-4 ${relationshipColor(centerOrg.relationship)}
                    transition-all duration-300 shadow-lg
                  `}
                >
                  <img src={centerOrg.logo} alt={centerOrg.name} className="w-full h-full object-cover" />
                </div>
                <div className="text-center mt-3">
                  <div className="text-yellow-400 text-base font-medium font-orbitron">{centerOrg.name}</div>
                  <div className="text-xs text-gray-400">본 조직</div>
                </div>
              </motion.div>
            )}

            {otherOrgs.map((organization, index) => {
              const position = polarCoordinate(index, otherOrgs.length)
              const isActive = highlightedOrganizations.has(organization.id)
              return (
                <motion.div
                  key={organization.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 200 }}
                  className="absolute"
                  style={{
                    left: `calc(50% + ${position.x}px - 56px)`,
                    top: `calc(50% + ${position.y}px - 56px)`,
                  }}
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOrgClick(organization.id)}
                    className={`
                      w-28 h-28 rounded-full overflow-hidden border-4 ${relationshipColor(organization.relationship)}
                      transition-all duration-300 hover:shadow-lg
                      ${isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}
                    `}
                  >
                    <img src={organization.logo} alt={organization.name} className="w-full h-full object-cover" />
                  </motion.button>

                  <div className="text-center mt-3">
                    <div className="text-white text-sm font-medium">{organization.name}</div>
                    <div
                      className={`text-sm ${
                        organization.relationship === 'friendly'
                          ? 'text-green-400'
                          : organization.relationship === 'hostile'
                          ? 'text-red-400'
                          : 'text-gray-400'
                      }`}
                    >
                      {RELATIONSHIP_LABEL[organization.relationship] ?? '관계 미상'}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        <div className="text-center mt-4 text-gray-500 text-sm">
          총 조직 수: {data.organizations.length} | 중심 조직: {centerOrg ? 1 : 0}개 | 주변 조직: {otherOrgs.length}개
        </div>
      </div>

      <OrganizationModal
        organizationId={selectedOrgId}
        isOpen={Boolean(selectedOrgId)}
        onClose={() => setSelectedOrgId(null)}
      />

      <AudioControls />
      <LogoutButton />
      <ManagementMenu />
    </div>
  )
}
