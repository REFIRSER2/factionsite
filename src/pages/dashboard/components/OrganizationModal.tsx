import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Modal } from '../../../components/base/Modal'
import { Button } from '../../../components/base/Button'
import { Input } from '../../../components/base/Input'
import { TextArea } from '../../../components/base/TextArea'
import { useAudio } from '../../../hooks/useAudio'
import { useOrganizationData } from '../../../context/OrganizationDataContext'
import type {
  Business,
  EvidenceItem,
  MapImage,
  Member,
  OrganizationRelationship,
} from '../../../types/organization'

interface OrganizationModalProps {
  organizationId: string | null
  isOpen: boolean
  onClose: () => void
}

type EditableMember = Omit<Member, 'age'> & { age: string }
type EditableBusiness = Omit<Business, 'employees'> & { employees: string }
type EditableEvidence = EvidenceItem

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
  const {
    data,
    updateOrganization,
    setMembers,
    setBusinesses,
    setEvidence,
    setMapImages,
    removeMember,
    removeBusiness,
    removeEvidence,
    removeMapImage,
  } = useOrganizationData()
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
  const organizationMapImages = useMemo(
    () => (organization ? data.mapImages[organization.id] ?? [] : []),
    [organization, data.mapImages]
  )

  const persistedMemberIds = useMemo(
    () => new Set(organizationMembers.map((member) => member.id)),
    [organizationMembers]
  )
  const persistedBusinessIds = useMemo(
    () => new Set(organizationBusinesses.map((business) => business.id)),
    [organizationBusinesses]
  )
  const persistedEvidenceIds = useMemo(
    () => new Set(organizationEvidence.map((item) => item.id)),
    [organizationEvidence]
  )
  const persistedMapIds = useMemo(
    () => new Set(organizationMapImages.map((item) => item.id)),
    [organizationMapImages]
  )

  useEffect(() => {
    if (isOpen && organizationId && !organization) {
      onClose()
    }
  }, [isOpen, organizationId, organization, onClose])

  const [activeTab, setActiveTab] = useState<'info' | 'members' | 'businesses' | 'evidence' | 'maps'>('info')
  const [infoForm, setInfoForm] = useState({
    name: '',
    description: '',
    location: '',
    relationship: 'neutral' as OrganizationRelationship,
  })
  const [membersDraft, setMembersDraft] = useState<EditableMember[]>([])
  const [businessDraft, setBusinessDraft] = useState<EditableBusiness[]>([])
  const [evidenceDraft, setEvidenceDraft] = useState<EditableEvidence[]>([])
  const [mapDraft, setMapDraft] = useState<(MapImage & { isNew?: boolean })[]>([])
  const [selectedMapPreviewId, setSelectedMapPreviewId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [pendingMapIndex, setPendingMapIndex] = useState<number | null>(null)
  const mapFileInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
    setEvidenceDraft(organizationEvidence.map((item) => ({ ...item })))
  }, [organization, organizationId, organizationEvidence])

  useEffect(() => {
    if (!organization || !organizationId) {
      return
    }
    setMapDraft(organizationMapImages.map((image) => ({ ...image, isNew: false })))
  }, [organization, organizationId, organizationMapImages])

  useEffect(() => {
    if (organizationMapImages.length === 0) {
      setSelectedMapPreviewId(null)
      return
    }

    setSelectedMapPreviewId((previous) => {
      if (previous && organizationMapImages.some((image) => image.id === previous)) {
        return previous
      }
      return organizationMapImages[0]?.id ?? null
    })
  }, [organizationMapImages])

  useEffect(() => {
    if (organizationId) {
      setActiveTab('info')
      setFeedback(null)
    }
  }, [organizationId])

  const selectedMapPreview = useMemo(
    () => organizationMapImages.find((image) => image.id === selectedMapPreviewId) ?? null,
    [organizationMapImages, selectedMapPreviewId]
  )

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
      images: item.images.filter((image) => image.trim().length > 0),
    }))
    setEvidence(organization.id, sanitized)
    setFeedback('증거 목록을 저장했습니다.')
    playTransitionSound()
  }

  const handleSaveMapImages = () => {
    const sanitized = mapDraft
      .filter((image) => image.url.trim().length > 0)
      .map(({ isNew, ...image }) => image)
    setMapImages(organization.id, sanitized)
    setFeedback('지도 이미지를 저장했습니다.')
    playTransitionSound()
  }

  const handleDeleteMember = (memberId: string) => {
    removeMember(organization.id, memberId)
    setMembersDraft((prev) => prev.filter((member) => member.id !== memberId))
    setFeedback('조직원 항목을 삭제했습니다.')
    playTransitionSound()
  }

  const handleDeleteBusiness = (businessId: string) => {
    removeBusiness(organization.id, businessId)
    setBusinessDraft((prev) => prev.filter((business) => business.id !== businessId))
    setFeedback('사업 정보를 삭제했습니다.')
    playTransitionSound()
  }

  const handleDeleteEvidence = (evidenceId: string) => {
    removeEvidence(organization.id, evidenceId)
    setEvidenceDraft((prev) => prev.filter((item) => item.id !== evidenceId))
    setFeedback('증거 항목을 삭제했습니다.')
    playTransitionSound()
  }

  const handleDeleteMapImage = (imageId: string) => {
    removeMapImage(organization.id, imageId)
    setMapDraft((prev) => prev.filter((image) => image.id !== imageId))
    setFeedback('지도 이미지를 삭제했습니다.')
    playTransitionSound()
  }

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(reader.error)
      reader.readAsDataURL(file)
    })

  const triggerFileInput = (key: string) => {
    const target = fileInputRefs.current[key]
    if (target) {
      target.click()
    }
  }

  const handleMemberPhotoUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setMembersDraft((prev) => {
        const next = [...prev]
        if (!next[index]) {
          return prev
        }
        next[index] = {
          ...next[index],
          photo: dataUrl,
        }
        return next
      })
      setFeedback('프로필 이미지를 추가했습니다. 저장 버튼을 눌러 반영하세요.')
    } catch (error) {
      console.error('Failed to read member photo file', error)
      setFeedback('이미지 파일을 불러오지 못했습니다. 다시 시도해주세요.')
    } finally {
      event.target.value = ''
    }
  }

  const handleBusinessImageUpload = async (
    index: number,
    key: 'image1' | 'image2',
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }

    try {
      const dataUrl = await readFileAsDataUrl(file)
      setBusinessDraft((prev) => {
        const next = [...prev]
        if (!next[index]) {
          return prev
        }
        next[index] = {
          ...next[index],
          [key]: dataUrl,
        }
        return next
      })
      setFeedback('사업체 이미지를 추가했습니다. 저장 버튼을 눌러 반영하세요.')
    } catch (error) {
      console.error('Failed to read business image file', error)
      setFeedback('이미지 파일을 불러오지 못했습니다. 다시 시도해주세요.')
    } finally {
      event.target.value = ''
    }
  }

  const handleEvidenceImageUpload = async (index: number, event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      return
    }

    try {
      const dataUrls = await Promise.all(files.map((file) => readFileAsDataUrl(file)))
      setEvidenceDraft((prev) => {
        const next = [...prev]
        if (!next[index]) {
          return prev
        }
        next[index] = {
          ...next[index],
          images: [...next[index].images, ...dataUrls],
        }
        return next
      })
      setFeedback('증거 이미지를 추가했습니다. 저장 버튼을 눌러 반영하세요.')
    } catch (error) {
      console.error('Failed to read evidence image file', error)
      setFeedback('이미지 파일을 불러오지 못했습니다. 다시 시도해주세요.')
    } finally {
      event.target.value = ''
    }
  }

  const handleRemoveEvidenceImage = (itemId: string, imageIndex: number) => {
    setEvidenceDraft((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) {
          return item
        }
        return {
          ...item,
          images: item.images.filter((_, currentIndex) => currentIndex !== imageIndex),
        }
      })
    )
  }

  const handleMapFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) {
      return
    }

    try {
      if (pendingMapIndex === null) {
        const mappedFiles = await Promise.all(
          files.map(async (file) => ({
            id: createId(`${organization.id}-map`),
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: await readFileAsDataUrl(file),
            notes: '',
            uploadedAt: new Date().toISOString(),
            isNew: true,
          }))
        )
        setMapDraft((prev) => [...prev, ...mappedFiles])
        setFeedback('지도 이미지를 추가했습니다. 저장 버튼을 눌러 반영하세요.')
      } else {
        const file = files[0]
        const dataUrl = await readFileAsDataUrl(file)
        setMapDraft((prev) => {
          const next = [...prev]
          if (!next[pendingMapIndex]) {
            return next
          }
          next[pendingMapIndex] = {
            ...next[pendingMapIndex],
            title: file.name.replace(/\.[^/.]+$/, ''),
            url: dataUrl,
            uploadedAt: new Date().toISOString(),
          }
          return next
        })
        setFeedback('지도 이미지를 교체했습니다. 저장 버튼을 눌러 반영하세요.')
      }
    } catch (error) {
      console.error('Failed to read map image file', error)
      setFeedback('이미지 파일을 불러오지 못했습니다. 다시 시도해주세요.')
    } finally {
      event.target.value = ''
      setPendingMapIndex(null)
    }
  }

  const requestMapUpload = (index: number | null) => {
    setPendingMapIndex(index)
    mapFileInputRef.current?.click()
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
      <div className="md:col-span-2">
        <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-yellow-200">데이터 요약</h3>
            <span className="text-xs text-gray-500">각 탭에서 세부 수정 및 삭제 가능합니다.</span>
          </div>
          <div className="space-y-4">
            <section>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-widest mb-2">
                조직원 ({organizationMembers.length})
              </h4>
              {organizationMembers.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-300">
                  {organizationMembers.slice(0, 5).map((member) => (
                    <li key={member.id} className="flex items-center justify-between">
                      <span>
                        {member.name}
                        {member.rank && <span className="text-gray-500"> · {member.rank}</span>}
                      </span>
                      <span className="text-xs text-gray-500">ID: {member.id}</span>
                    </li>
                  ))}
                  {organizationMembers.length > 5 && (
                    <li className="text-xs text-gray-500">그 외 {organizationMembers.length - 5}명</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">조직원 목록이 비어 있습니다.</p>
              )}
            </section>
            <section>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-widest mb-2">
                사업체 ({organizationBusinesses.length})
              </h4>
              {organizationBusinesses.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-300">
                  {organizationBusinesses.slice(0, 5).map((business) => (
                    <li key={business.id} className="flex items-center justify-between">
                      <span>{business.name}</span>
                      <span className="text-xs text-gray-500">직원 {business.employees}명</span>
                    </li>
                  ))}
                  {organizationBusinesses.length > 5 && (
                    <li className="text-xs text-gray-500">그 외 {organizationBusinesses.length - 5}곳</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">사업체 목록이 비어 있습니다.</p>
              )}
            </section>
            <section>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-widest mb-2">
                증거 ({organizationEvidence.length})
              </h4>
              {organizationEvidence.length > 0 ? (
                <ul className="space-y-1 text-sm text-gray-300">
                  {organizationEvidence.slice(0, 5).map((item) => (
                    <li key={item.id} className="flex items-center justify-between">
                      <span>{item.target || '대상 미상'}</span>
                      <span className="text-xs text-gray-500">ID: {item.id}</span>
                    </li>
                  ))}
                  {organizationEvidence.length > 5 && (
                    <li className="text-xs text-gray-500">그 외 {organizationEvidence.length - 5}건</li>
                  )}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">증거 목록이 비어 있습니다.</p>
              )}
            </section>
            <section>
              <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-widest mb-2">
                지도 이미지 ({organizationMapImages.length})
              </h4>
              {organizationMapImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {organizationMapImages.slice(0, 4).map((image) => (
                    <div
                      key={image.id}
                      className="relative rounded-lg overflow-hidden border border-yellow-400/20"
                    >
                      <img src={image.url} alt={image.title} className="w-full h-24 object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-2 py-1 text-xs text-gray-200 truncate">
                        {image.title}
                      </div>
                    </div>
                  ))}
                  {organizationMapImages.length > 4 && (
                    <div className="text-xs text-gray-500 col-span-full">
                      그 외 {organizationMapImages.length - 4}개의 이미지
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">등록된 지도 이미지가 없습니다.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )

  const renderMembersTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
          </div>
          <div>
            <label className="block text-sm font-medium text-yellow-400 mb-2">프로필 사진</label>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="w-16 h-16 rounded-full overflow-hidden border border-yellow-400/30 bg-gray-900 flex items-center justify-center">
                {member.photo ? (
                  <img src={member.photo} alt={member.name || 'profile'} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">이미지 없음</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={(element) => {
                    if (element) {
                      fileInputRefs.current[`${member.id}-photo`] = element
                    } else {
                      delete fileInputRefs.current[`${member.id}-photo`]
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleMemberPhotoUpload(index, event)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerFileInput(`${member.id}-photo`)}
                >
                  <i className="ri-image-add-line mr-1" /> 이미지 선택
                </Button>
                {member.photo && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setMembersDraft((prev) => {
                        const next = [...prev]
                        next[index] = { ...next[index], photo: '' }
                        return next
                      })
                    }
                  >
                    <i className="ri-delete-bin-6-line mr-1" /> 제거
                  </Button>
                )}
              </div>
            </div>
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
                {member.photo ? (
                  <img src={member.photo} alt={member.name || 'profile'} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-900">이미지 없음</div>
                )}
              </div>
              <span className="text-sm text-gray-400">ID: {member.id}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setMembersDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                }
              >
                <i className="ri-close-line mr-1" /> 임시 제거
              </Button>
              {persistedMemberIds.has(member.id) && (
                <Button variant="danger" size="sm" onClick={() => handleDeleteMember(member.id)}>
                  <i className="ri-delete-bin-6-line mr-1" /> 영구 삭제
                </Button>
              )}
            </div>
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

      <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-yellow-200">조직원 목록</h3>
          <span className="text-xs text-gray-500">{organizationMembers.length}명</span>
        </div>
        {organizationMembers.length > 0 ? (
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {organizationMembers.map((member) => (
              <div
                key={member.id}
                className="border border-yellow-400/10 bg-black/30 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-yellow-400/30 bg-gray-900">
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                          이미지 없음
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-white">{member.name}</p>
                      <p className="text-sm text-gray-400">
                        {member.rank ? member.rank : '직급 미기입'} · ID: {member.id}
                      </p>
                    </div>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteMember(member.id)}>
                    <i className="ri-delete-bin-6-line mr-1" /> 삭제
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                  <div>
                    <dt className="font-semibold text-gray-300">나이</dt>
                    <dd className="text-white">{member.age ? `${member.age}세` : '미기입'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-300">이동 수단</dt>
                    <dd className="text-white">{member.vehicle || '미기입'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-semibold text-gray-300">비고</dt>
                    <dd className="text-white whitespace-pre-line">{member.notes || '미기입'}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 min-h-[200px]">
            조직원 목록이 없습니다. 정보를 입력 후 저장해보세요.
          </div>
        )}
      </div>
    </div>
  )

  const renderBusinessesTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
            <div className="space-y-3">
              <label className="block text-sm font-medium text-yellow-400">대표 이미지</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900 flex items-center justify-center">
                {business.image1 ? (
                  <img src={business.image1} alt={`${business.name || '사업체'} 대표`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">이미지가 선택되지 않았습니다.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={(element) => {
                    if (element) {
                      fileInputRefs.current[`${business.id}-image1`] = element
                    } else {
                      delete fileInputRefs.current[`${business.id}-image1`]
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleBusinessImageUpload(index, 'image1', event)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerFileInput(`${business.id}-image1`)}
                >
                  <i className="ri-image-add-line mr-1" /> 이미지 선택
                </Button>
                {business.image1 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setBusinessDraft((prev) => {
                        const next = [...prev]
                        next[index] = { ...next[index], image1: '' }
                        return next
                      })
                    }
                  >
                    <i className="ri-delete-bin-6-line mr-1" /> 제거
                  </Button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-yellow-400">추가 이미지</label>
              <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900 flex items-center justify-center">
                {business.image2 ? (
                  <img src={business.image2} alt={`${business.name || '사업체'} 추가`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs text-gray-500">선택된 이미지가 없습니다.</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  ref={(element) => {
                    if (element) {
                      fileInputRefs.current[`${business.id}-image2`] = element
                    } else {
                      delete fileInputRefs.current[`${business.id}-image2`]
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleBusinessImageUpload(index, 'image2', event)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => triggerFileInput(`${business.id}-image2`)}
                >
                  <i className="ri-image-add-line mr-1" /> 이미지 선택
                </Button>
                {business.image2 && (
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      setBusinessDraft((prev) => {
                        const next = [...prev]
                        next[index] = { ...next[index], image2: '' }
                        return next
                      })
                    }
                  >
                    <i className="ri-delete-bin-6-line mr-1" /> 제거
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">ID: {business.id}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setBusinessDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                }
              >
                <i className="ri-close-line mr-1" /> 임시 제거
              </Button>
              {persistedBusinessIds.has(business.id) && (
                <Button variant="danger" size="sm" onClick={() => handleDeleteBusiness(business.id)}>
                  <i className="ri-delete-bin-6-line mr-1" /> 영구 삭제
                </Button>
              )}
            </div>
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

      <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-yellow-200">사업체 목록</h3>
          <span className="text-xs text-gray-500">{organizationBusinesses.length}곳</span>
        </div>
        {organizationBusinesses.length > 0 ? (
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {organizationBusinesses.map((business) => (
              <div
                key={business.id}
                className="border border-yellow-400/10 bg-black/30 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{business.name}</p>
                    <p className="text-sm text-gray-400">
                      직원 {business.employees}명 · ID: {business.id}
                    </p>
                    <p className="text-xs text-gray-500">{business.address || '주소 미기입'}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteBusiness(business.id)}>
                    <i className="ri-delete-bin-6-line mr-1" /> 삭제
                  </Button>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                  <div>
                    <dt className="font-semibold text-gray-300">합법적 소유자</dt>
                    <dd className="text-white">{business.legalOwner || '미기입'}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-300">실제 소유자</dt>
                    <dd className="text-white">{business.actualOwner || '미기입'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="font-semibold text-gray-300">제공 서비스 / 상품</dt>
                    <dd className="text-white whitespace-pre-line">{business.products || '미기입'}</dd>
                  </div>
                </dl>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900">
                    {business.image1 ? (
                      <img src={business.image1} alt={`${business.name} 대표`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
                        이미지 없음
                      </div>
                    )}
                  </div>
                  {business.image2 ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900">
                      <img src={business.image2} alt={`${business.name} 추가`} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/10 bg-black/30 flex items-center justify-center text-xs text-gray-500">
                      추가 이미지 없음
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 min-h-[200px]">
            사업체 목록이 없습니다. 정보를 입력 후 저장해보세요.
          </div>
        )}
      </div>
    </div>
  )

  const renderEvidenceTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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

          <div className="space-y-3">
            <label className="block text-sm font-medium text-yellow-400">이미지 첨부</label>
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={(element) => {
                  if (element) {
                    fileInputRefs.current[`${item.id}-evidence`] = element
                  } else {
                    delete fileInputRefs.current[`${item.id}-evidence`]
                  }
                }}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => handleEvidenceImageUpload(index, event)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => triggerFileInput(`${item.id}-evidence`)}
              >
                <i className="ri-image-add-line mr-1" /> 이미지 추가
              </Button>
              {item.images.length > 0 && (
                <span className="text-xs text-gray-400">{item.images.length}개 첨부됨</span>
              )}
            </div>
            {item.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {item.images.map((imageUrl, imageIndex) => (
                  <div key={`${item.id}-draft-image-${imageIndex}`} className="space-y-2">
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900">
                      <img
                        src={imageUrl}
                        alt={`${item.id} evidence ${imageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      className="w-full"
                      onClick={() => handleRemoveEvidenceImage(item.id, imageIndex)}
                    >
                      <i className="ri-delete-bin-6-line mr-1" /> 제거
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 border border-dashed border-yellow-400/20 rounded-lg p-3 bg-black/20">
                첨부된 이미지가 없습니다.
              </p>
            )}
          </div>

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
              <span className="text-sm text-gray-400">이미지 {item.images.length}개</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setEvidenceDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                }
              >
                <i className="ri-close-line mr-1" /> 임시 제거
              </Button>
              {persistedEvidenceIds.has(item.id) && (
                <Button variant="danger" size="sm" onClick={() => handleDeleteEvidence(item.id)}>
                  <i className="ri-delete-bin-6-line mr-1" /> 영구 삭제
                </Button>
              )}
            </div>
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

      <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-yellow-200">증거 목록</h3>
          <span className="text-xs text-gray-500">{organizationEvidence.length}건</span>
        </div>
        {organizationEvidence.length > 0 ? (
          <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
            {organizationEvidence.map((item) => (
              <div
                key={item.id}
                className="border border-yellow-400/10 bg-black/30 rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-white">{item.target || '대상 미상'}</p>
                    <p className="text-sm text-gray-400">ID: {item.id}</p>
                    <p className="text-xs text-gray-500">{item.location || '위치 미기입'}</p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => handleDeleteEvidence(item.id)}>
                    <i className="ri-delete-bin-6-line mr-1" /> 삭제
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400">
                  <span>연관 인물: {item.additionalPersons || '정보 없음'}</span>
                  <span
                    className={`px-2 py-1 rounded-full border text-[11px] font-semibold ${
                      item.used
                        ? 'border-green-400 text-green-300 bg-green-400/10'
                        : 'border-yellow-400/20 text-gray-400'
                    }`}
                  >
                    {item.used ? '사용됨' : '미사용'}
                  </span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-line border-t border-yellow-400/10 pt-3">
                  {item.details || '세부 내용이 입력되지 않았습니다.'}
                </p>
                {item.images.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {item.images.map((imageUrl, imageIndex) => (
                      <div key={`${item.id}-image-${imageIndex}`} className="space-y-2">
                        <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20 bg-gray-900">
                          <img
                            src={imageUrl}
                            alt={`${item.target || '증거'} 이미지 ${imageIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          className="w-full"
                          onClick={() => window.open(imageUrl, '_blank', 'noopener,noreferrer')}
                        >
                          <i className="ri-external-link-line mr-1" /> 새 창에서 보기
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">첨부된 이미지가 없습니다.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-sm text-gray-500 min-h-[200px]">
            증거 목록이 없습니다. 증거를 추가하고 저장해보세요.
          </div>
        )}
      </div>
    </div>
  )

  const renderMapTab = () => (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="space-y-4">
        <input
          ref={mapFileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleMapFileChange}
        />
        {mapDraft.length > 0 ? (
          mapDraft.map((image, index) => (
            <div
              key={image.id}
              className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-4 space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <Input
                    label="지도 제목"
                    value={image.title}
                    onChange={(event) =>
                      setMapDraft((prev) => {
                        const next = [...prev]
                        next[index] = { ...next[index], title: event.target.value }
                        return next
                      })
                    }
                  />
                  <TextArea
                    label="비고"
                    value={image.notes}
                    onChange={(event) =>
                      setMapDraft((prev) => {
                        const next = [...prev]
                        next[index] = { ...next[index], notes: event.target.value }
                        return next
                      })
                    }
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <p>업데이트: {new Date(image.uploadedAt).toLocaleString()}</p>
                    <p>{image.isNew ? '새로 추가된 이미지' : '등록된 이미지'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20">
                    <img src={image.url} alt={image.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => requestMapUpload(index)}>
                      <i className="ri-refresh-line mr-1" /> 이미지 교체
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => window.open(image.url, '_blank', 'noopener,noreferrer')}
                    >
                      <i className="ri-external-link-line mr-1" /> 새 창에서 보기
                    </Button>
                    {persistedMapIds.has(image.id) ? (
                      <Button variant="danger" size="sm" onClick={() => handleDeleteMapImage(image.id)}>
                        <i className="ri-delete-bin-6-line mr-1" /> 영구 삭제
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setMapDraft((prev) => prev.filter((_, currentIndex) => currentIndex !== index))
                        }
                      >
                        <i className="ri-close-line mr-1" /> 임시 제거
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-gray-900/40 border border-dashed border-yellow-400/30 rounded-xl p-8 text-center space-y-3">
            <i className="ri-map-pin-2-line text-4xl text-yellow-400" />
            <p className="text-sm text-gray-400">등록된 지도 이미지가 없습니다. 새 이미지를 업로드해보세요.</p>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="secondary" onClick={() => requestMapUpload(null)}>
            <i className="ri-map-pin-add-line mr-2" /> 지도 이미지 추가
          </Button>
          <Button onClick={handleSaveMapImages}>
            <i className="ri-save-3-line mr-2" /> 지도 이미지 저장
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-yellow-200">지도 미리보기</h3>
            {selectedMapPreview && (
              <span className="text-xs text-gray-500">
                업데이트: {new Date(selectedMapPreview.uploadedAt).toLocaleString()}
              </span>
            )}
          </div>
          {selectedMapPreview ? (
            <div className="space-y-3">
              <div className="relative aspect-video rounded-lg overflow-hidden border border-yellow-400/20">
                <img
                  src={selectedMapPreview.url}
                  alt={selectedMapPreview.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-white">{selectedMapPreview.title}</p>
                  <p className="text-xs text-gray-500">ID: {selectedMapPreview.id}</p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => window.open(selectedMapPreview.url, '_blank', 'noopener,noreferrer')}
                >
                  <i className="ri-external-link-line mr-1" /> 새 창에서 보기
                </Button>
              </div>
              <p className="text-sm text-gray-300 whitespace-pre-line border-t border-yellow-400/10 pt-3">
                {selectedMapPreview.notes || '비고가 입력되지 않았습니다.'}
              </p>
            </div>
          ) : (
            <div className="min-h-[240px] flex items-center justify-center text-sm text-gray-500">
              지도 목록에서 이미지를 선택하면 크게 볼 수 있습니다.
            </div>
          )}
        </div>

        <div className="bg-gray-900/60 border border-yellow-400/20 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-yellow-200">등록된 지도 목록</h3>
            <span className="text-xs text-gray-500">{organizationMapImages.length}개</span>
          </div>
          {organizationMapImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 max-h-[260px] overflow-y-auto pr-1">
              {organizationMapImages.map((image) => {
                const mapIndex = mapDraft.findIndex((item) => item.id === image.id)
                const isActive = image.id === selectedMapPreviewId
                return (
                  <div
                    key={image.id}
                    className={`border rounded-lg p-3 space-y-2 bg-black/30 transition-colors ${
                      isActive
                        ? 'border-yellow-400/60'
                        : 'border-yellow-400/10 hover:border-yellow-400/40'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMapPreviewId(image.id)}
                      className="block w-full focus:outline-none text-left space-y-2"
                    >
                      <div className="relative aspect-video rounded-md overflow-hidden border border-yellow-400/20 bg-gray-900">
                        <img src={image.url} alt={image.title} className="w-full h-full object-cover" />
                      </div>
                      <p className="text-sm text-white truncate">{image.title}</p>
                      <p className="text-xs text-gray-500">{new Date(image.uploadedAt).toLocaleDateString()}</p>
                    </button>
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => requestMapUpload(mapIndex === -1 ? null : mapIndex)}
                      >
                        <i className="ri-refresh-line mr-1" /> 교체
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteMapImage(image.id)}>
                        <i className="ri-delete-bin-6-line mr-1" /> 삭제
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="min-h-[160px] flex items-center justify-center text-sm text-gray-500">
              등록된 지도 이미지가 없습니다. 새로 추가해보세요.
            </div>
          )}
        </div>
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
            { id: 'maps', label: '지도 관리', icon: 'ri-map-pin-2-line' },
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
          {activeTab === 'maps' && renderMapTab()}
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
