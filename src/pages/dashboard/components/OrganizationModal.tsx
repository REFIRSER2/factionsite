import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../../components/base/Modal'
import { Button } from '../../../components/base/Button'
import { Input } from '../../../components/base/Input'
import { TextArea } from '../../../components/base/TextArea'
import { useAudio } from '../../../hooks/useAudio'
import { useOrganizationData } from '../../../context/OrganizationDataContext'
import { Business, EvidenceItem, Member, OrganizationRelationship } from '../../../types/organization'

interface OrganizationModalProps {
  organizationId: string | null
  isOpen: boolean
  onClose: () => void
}

type EditableMember = Omit<Member, 'age'> & { age: string }
type EditableBusiness = Omit<Business, 'employees'> & { employees: string }
type EditableEvidence = EvidenceItem & { imagesText: string }

const RELATIONSHIP_OPTIONS: { value: OrganizationRelationship; label: string }[] = [
  { value: 'friendly', label: '우호' },
  { value: 'neutral', label: '중립' },
  { value: 'hostile', label: '적대' },
]

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const getRelationshipLabel = (value: OrganizationRelationship) => {
  if (value === 'center') {
    return '본 조직'
  }
  return RELATIONSHIP_OPTIONS.find((option) => option.value === value)?.label ?? '관계 미상'
}

export const OrganizationModal = ({ organizationId, isOpen, onClose }: OrganizationModalProps) => {
  const { data, updateOrganization, setMembers, setBusinesses, setEvidence } = useOrganizationData()
  const { playClickSound, playTransitionSound } = useAudio()

  const organization = useMemo(
    () => data.organizations.find((item) => item.id === organizationId),
    [data.organizations, organizationId]
  )

  const organizationMembers = useMemo(
    () => (organization ? data.members[organization.id] ?? [] : []),
    [organization, data.members]
  )
  const organizationBusinesses = useMemo(
    () => (organization ? data.businesses[organization.id] ?? [] : []),
    [organization, data.businesses]
  )
  const organizationEvidence = useMemo(
    () => (organization ? data.evidence[organization.id] ?? [] : []),
    [organization, data.evidence]
  )

  useEffect(() => {
    if (isOpen && organizationId && !organization) {
      onClose()
    }
  }, [isOpen, organizationId, organization, onClose])

  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'businesses' | 'evidence'>('info')
  const [infoForm, setInfoForm] = useState({
    name: '',
    description: '',
    location: '',
    relationship: 'neutral' as OrganizationRelationship,
  })
  const [membersDraft, setMembersDraft] = useState<EditableMember[]>([])
  const [businessDraft, setBusinessDraft] = useState<EditableBusiness[]>([])
  const [evidenceDraft, setEvidenceDraft] = useState<EditableEvidence[]>([])
  const [feedback, setFeedback] = useState<string | null>(null)

  useEffect(() => {
    if (!organization || !organizationId) {
      return
    }

    setInfoForm({
      name: organization.name,
      description: organization.description,
      location: organization.location,
      relationship: organization.relationship,
    })
  }, [organization, organizationId])

  useEffect(() => {
    if (!organization || !organizationId) {
      return
    }
    setMembersDraft(organizationMembers.map((member) => ({ ...member, age: member.age ? String(member.age) : '' })))
  }, [organization, organizationId, organizationMembers])

  useEffect(() => {
    if (!organization || !organizationId) {
      return
    }
    setBusinessDraft(
      organizationBusinesses.map((business) => ({
        ...business,
        employees: business.employees ? String(business.employees) : '',
      }))
    )
  }, [organization, organizationId, organizationBusinesses])

  useEffect(() => {
    if (!organization || !organizationId) {
      return
    }
    setEvidenceDraft(
      organizationEvidence.map((item) => ({
        ...item,
        imagesText: item.images.join('\n'),
      }))
    )
  }, [organization, organizationId, organizationEvidence])

  useEffect(() => {
    if (organizationId) {
      setActiveTab('info')
      setFeedback(null)
    }
  }, [organizationId])

  if (!organizationId || !organization) {
    return null
  }

  const handleSaveInfo = () => {
    updateOrganization(organization.id, {
      name: infoForm.name,
      description: infoForm.description,
      location: infoForm.location,
      relationship: infoForm.relationship,
    })
    setFeedback('조직 기본 정보를 저장했습니다.')
    playTransitionSound()
  }

  const handleSaveMembers = () => {
    const sanitized = membersDraft
      .filter((member) => member.name.trim().length > 0)
      .map((member) => ({
        ...member,
        age: Number(member.age) || 0,
      }))
    setMembers(organization.id, sanitized)
    setFeedback('조직원 정보를 저장했습니다.')
    playTransitionSound()
  }

  const handleSaveBusinesses = () => {
    const sanitized = businessDraft
      .filter((business) => business.name.trim().length > 0)
      .map((business) => ({
        ...business,
        employees: Number(business.employees) || 0,
      }))
    setBusinesses(organization.id, sanitized)
    setFeedback('조직 사업 정보를 저장했습니다.')
    playTransitionSound()
  }

  const handleSaveEvidence = () => {
    const sanitized = evidenceDraft.map((item) => ({
      ...item,
      images: item.imagesText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0),
    }))
    setEvidence(organization.id, sanitized)
    setFeedback('증거 목록을 저장했습니다.')
    playTransitionSound()
  }

  const renderInfoTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-4">
        <Input
          label="조직 명칭"
          value={infoForm.name}
          onChange={(event) => setInfoForm((prev) => ({ ...prev, name: event.target.value }))}
        />
        <Input
          label="주요 활동 지역"
          value={infoForm.location}
          onChange={(event) => setInfoForm((prev) => ({ ...prev, location: event.target.value }))}
        />
        <div>
          <label className="block text-sm font-medium text-yellow-400 mb-2">관계 상태</label>
          <div className="flex flex-wrap gap-3">
            {RELATIONSHIP_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setInfoForm((prev) => ({ ...prev, relationship: option.value }))}
                className={`
                  px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium
                  ${
                    infoForm.relationship === option.value
                      ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10'
                      : 'border-yellow-400/20 text-gray-400 hover:text-yellow-300'
                  }
                `}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <TextArea
        label="조직 개요"
        value={infoForm.description}
        onChange={(event) => setInfoForm((prev) => ({ ...prev, description: event.target.value }))}
      />
      <div className="md:col-span-2 flex justify-end">
        <Button onClick={handleSaveInfo}>
          <i className="ri-save-3-line mr-2" /> 기본 정보 저장
        </Button>
      </div>
    </div>
  )

  const renderMembersTab = () => (
    <div className="space-y-4">
      {membersDraft.map((member, index) => (
        <div key={member.id} className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="이름"
              value={member.name}
              onChange={(event) =>
                setMembersDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], name: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="직급"
              value={member.rank}
              onChange={(event) =>
                setMembersDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], rank: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="나이"
              type="number"
              min="0"
              value={member.age}
              onChange={(event) =>
                setMembersDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], age: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="주요 이동 수단"
              value={member.vehicle}
              onChange={(event) =>
                setMembersDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], vehicle: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="프로필 사진 URL"
              value={member.photo}
              onChange={(event) =>
                setMembersDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], photo: event.target.value }
                  return next
                })
              }
            />
          </div>
          <TextArea
            label="비고"
            value={member.notes}
            onChange={(event) =>
              setMembersDraft((prev) => {
                const next = [...prev]
                next[index] = { ...next[index], notes: event.target.value }
                return next
              })
            }
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-yellow-400/30">
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
              </div>
              <span className="text-sm text-gray-400">ID: {member.id}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setMembersDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
              }
            >
              <i className="ri-delete-bin-6-line mr-1" /> 제거
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            setMembersDraft((prev) => [
              ...prev,
              {
                id: createId(`${organization.id}-mem`),
                name: '',
                rank: '',
                age: '',
                photo: '',
                vehicle: '',
                notes: '',
              },
            ])
          }
        >
          <i className="ri-user-add-line mr-2" /> 조직원 추가
        </Button>
        <Button onClick={handleSaveMembers}>
          <i className="ri-save-3-line mr-2" /> 조직원 저장
        </Button>
      </div>
    </div>
  )

  const renderBusinessesTab = () => (
    <div className="space-y-4">
      {businessDraft.map((business, index) => (
        <div key={business.id} className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="사업체 명"
              value={business.name}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], name: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="직원 수"
              type="number"
              min="0"
              value={business.employees}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], employees: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="주소"
              value={business.address}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], address: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="합법적 소유자"
              value={business.legalOwner}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], legalOwner: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="실제 소유자"
              value={business.actualOwner}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], actualOwner: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="제공 서비스 / 상품"
              value={business.products}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], products: event.target.value }
                  return next
                })
              }
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="대표 이미지 URL"
              value={business.image1}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], image1: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="추가 이미지 URL"
              value={business.image2 ?? ''}
              onChange={(event) =>
                setBusinessDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], image2: event.target.value }
                  return next
                })
              }
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">ID: {business.id}</span>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setBusinessDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
              }
            >
              <i className="ri-delete-bin-6-line mr-1" /> 제거
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            setBusinessDraft((prev) => [
              ...prev,
              {
                id: createId(`${organization.id}-biz`),
                name: '',
                address: '',
                employees: '',
                products: '',
                legalOwner: '',
                actualOwner: '',
                image1: '',
                image2: '',
              },
            ])
          }
        >
          <i className="ri-store-3-line mr-2" /> 사업체 추가
        </Button>
        <Button onClick={handleSaveBusinesses}>
          <i className="ri-save-3-line mr-2" /> 사업 정보 저장
        </Button>
      </div>
    </div>
  )

  const renderEvidenceTab = () => (
    <div className="space-y-4">
      {evidenceDraft.map((item, index) => (
        <div key={item.id} className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="증거 ID"
              value={item.id}
              onChange={(event) =>
                setEvidenceDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], id: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="목표 인물"
              value={item.target}
              onChange={(event) =>
                setEvidenceDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], target: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="관련 위치"
              value={item.location}
              onChange={(event) =>
                setEvidenceDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], location: event.target.value }
                  return next
                })
              }
            />
            <Input
              label="연관 인물"
              value={item.additionalPersons}
              onChange={(event) =>
                setEvidenceDraft((prev) => {
                  const next = [...prev]
                  next[index] = { ...next[index], additionalPersons: event.target.value }
                  return next
                })
              }
            />
          </div>

          <TextArea
            label="세부 내용"
            value={item.details}
            onChange={(event) =>
              setEvidenceDraft((prev) => {
                const next = [...prev]
                next[index] = { ...next[index], details: event.target.value }
                return next
              })
            }
          />

          <TextArea
            label="이미지 URL 목록 (줄바꿈으로 구분)"
            value={item.imagesText}
            onChange={(event) =>
              setEvidenceDraft((prev) => {
                const next = [...prev]
                next[index] = { ...next[index], imagesText: event.target.value }
                return next
              })
            }
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() =>
                  setEvidenceDraft((prev) => {
                    const next = [...prev]
                    next[index] = { ...next[index], used: !next[index].used }
                    return next
                  })
                }
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-200
                  ${
                    item.used
                      ? 'border-green-400 text-green-300 bg-green-400/10'
                      : 'border-yellow-400/20 text-gray-400 hover:text-yellow-300'
                  }
                `}
              >
                {item.used ? '사용됨' : '미사용'}
              </button>
              <span className="text-sm text-gray-400">이미지 {item.imagesText ? item.imagesText.split('\n').filter(Boolean).length : 0}개</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() =>
                setEvidenceDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
              }
            >
              <i className="ri-delete-bin-6-line mr-1" /> 제거
            </Button>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={() =>
            setEvidenceDraft((prev) => [
              ...prev,
              {
                id: createId(`${organization.id}-evd`),
                used: false,
                target: '',
                location: '',
                additionalPersons: '',
                details: '',
                images: [],
                imagesText: '',
              },
            ])
          }
        >
          <i className="ri-add-circle-line mr-2" /> 증거 추가
        </Button>
        <Button onClick={handleSaveEvidence}>
          <i className="ri-save-3-line mr-2" /> 증거 저장
        </Button>
      </div>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-yellow-400/60">
              <img src={organization.logo} alt={organization.name} className="w-full h-full object-cover" />
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-white font-orbitron">{organization.name}</h2>
              <p className="text-gray-400">{organization.location}</p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400/10 text-yellow-300 border border-yellow-400/40">
                {getRelationshipLabel(organization.relationship)}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <i className="ri-close-line text-2xl" />
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          {[
            { id: 'info', label: '조직 정보', icon: 'ri-building-line' },
            { id: 'members', label: '조직원', icon: 'ri-team-line' },
            { id: 'businesses', label: '사업체', icon: 'ri-store-3-line' },
            { id: 'evidence', label: '증거', icon: 'ri-file-list-line' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                playClickSound()
                setFeedback(null)
                setActiveTab(tab.id as typeof activeTab)
              }}
              className={`
                px-4 py-2 rounded-lg border transition-all duration-200 text-sm font-medium flex items-center space-x-2
                ${
                  activeTab === tab.id
                    ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10'
                    : 'border-yellow-400/20 text-gray-400 hover:text-yellow-300'
                }
              `}
            >
              <i className={`${tab.icon}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-6">
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'members' && renderMembersTab()}
          {activeTab === 'businesses' && renderBusinessesTab()}
          {activeTab === 'evidence' && renderEvidenceTab()}
        </div>

        {feedback && (
          <div className="text-sm text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
            {feedback}
          </div>
        )}
      </div>
    </Modal>
  )
}
