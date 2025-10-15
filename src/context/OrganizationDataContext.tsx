import { createContext, useContext, useMemo, useState, useEffect, ReactNode } from 'react'
import { organizations as organizationSeed } from '../mocks/organizations'
import { members as memberSeed } from '../mocks/members'
import { businesses as businessSeed } from '../mocks/businesses'
import { evidence as evidenceSeed } from '../mocks/evidence'
import {
  Business,
  EvidenceItem,
  Member,
  Organization,
  OrganizationDataStore,
  MapImage,
} from '../types/organization'

interface OrganizationDataContextValue {
  data: OrganizationDataStore
  updateOrganization: (organizationId: string, updates: Partial<Organization>) => void
  setMembers: (organizationId: string, nextMembers: Member[]) => void
  setBusinesses: (organizationId: string, nextBusinesses: Business[]) => void
  setEvidence: (organizationId: string, nextEvidence: EvidenceItem[]) => void
  setMapImages: (organizationId: string, nextImages: MapImage[]) => void
  removeMember: (organizationId: string, memberId: string) => void
  removeBusiness: (organizationId: string, businessId: string) => void
  removeEvidence: (organizationId: string, evidenceId: string) => void
  removeMapImage: (organizationId: string, imageId: string) => void
}

const STORAGE_KEY = 'vitalle-organization-data'

const OrganizationDataContext = createContext<OrganizationDataContextValue | undefined>(undefined)

const ensureRecord = <T,>(organizations: Organization[], record: Record<string, T[]>) => {
  const nextRecord: Record<string, T[]> = { ...record }
  organizations.forEach((organization) => {
    if (!nextRecord[organization.id]) {
      nextRecord[organization.id] = []
    }
  })
  return nextRecord
}

const loadInitialStore = (): OrganizationDataStore => {
  if (typeof window === 'undefined') {
    return {
      organizations: organizationSeed,
      members: ensureRecord(organizationSeed, memberSeed as Record<string, Member[]>),
      businesses: ensureRecord(organizationSeed, businessSeed as Record<string, Business[]>),
      evidence: ensureRecord(organizationSeed, evidenceSeed as Record<string, EvidenceItem[]>),
      mapImages: ensureRecord(organizationSeed, {} as Record<string, MapImage[]>),
    }
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as OrganizationDataStore
      const organizations = parsed.organizations?.length ? parsed.organizations : organizationSeed
      return {
        organizations,
        members: ensureRecord(organizations, parsed.members ?? {}),
        businesses: ensureRecord(organizations, parsed.businesses ?? {}),
        evidence: ensureRecord(organizations, parsed.evidence ?? {}),
        mapImages: ensureRecord(organizations, (parsed.mapImages ?? {}) as Record<string, MapImage[]>),
      }
    } catch (error) {
      console.warn('Failed to parse organization data store, using seed data.', error)
    }
  }

  return {
    organizations: organizationSeed,
    members: ensureRecord(organizationSeed, memberSeed as Record<string, Member[]>),
    businesses: ensureRecord(organizationSeed, businessSeed as Record<string, Business[]>),
    evidence: ensureRecord(organizationSeed, evidenceSeed as Record<string, EvidenceItem[]>),
    mapImages: ensureRecord(organizationSeed, {} as Record<string, MapImage[]>),
  }
}

export const OrganizationDataProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<OrganizationDataStore>(loadInitialStore)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
    }
  }, [store])

  const updateOrganization = (organizationId: string, updates: Partial<Organization>) => {
    setStore((prev) => {
      const organizations = prev.organizations.map((organization) =>
        organization.id === organizationId ? { ...organization, ...updates } : organization
      )
      return {
        ...prev,
        organizations,
      }
    })
  }

  const setMembers = (organizationId: string, nextMembers: Member[]) => {
    setStore((prev) => ({
      ...prev,
      members: ensureRecord(prev.organizations, {
        ...prev.members,
        [organizationId]: nextMembers,
      }),
    }))
  }

  const setBusinesses = (organizationId: string, nextBusinesses: Business[]) => {
    setStore((prev) => ({
      ...prev,
      businesses: ensureRecord(prev.organizations, {
        ...prev.businesses,
        [organizationId]: nextBusinesses,
      }),
    }))
  }

  const setEvidence = (organizationId: string, nextEvidence: EvidenceItem[]) => {
    setStore((prev) => ({
      ...prev,
      evidence: ensureRecord(prev.organizations, {
        ...prev.evidence,
        [organizationId]: nextEvidence,
      }),
    }))
  }

  const setMapImages = (organizationId: string, nextImages: MapImage[]) => {
    setStore((prev) => ({
      ...prev,
      mapImages: ensureRecord(prev.organizations, {
        ...prev.mapImages,
        [organizationId]: nextImages,
      }),
    }))
  }

  const removeMember = (organizationId: string, memberId: string) => {
    setStore((prev) => ({
      ...prev,
      members: ensureRecord(prev.organizations, {
        ...prev.members,
        [organizationId]: (prev.members[organizationId] ?? []).filter((member) => member.id !== memberId),
      }),
    }))
  }

  const removeBusiness = (organizationId: string, businessId: string) => {
    setStore((prev) => ({
      ...prev,
      businesses: ensureRecord(prev.organizations, {
        ...prev.businesses,
        [organizationId]: (prev.businesses[organizationId] ?? []).filter(
          (business) => business.id !== businessId
        ),
      }),
    }))
  }

  const removeEvidence = (organizationId: string, evidenceId: string) => {
    setStore((prev) => ({
      ...prev,
      evidence: ensureRecord(prev.organizations, {
        ...prev.evidence,
        [organizationId]: (prev.evidence[organizationId] ?? []).filter(
          (evidence) => evidence.id !== evidenceId
        ),
      }),
    }))
  }

  const removeMapImage = (organizationId: string, imageId: string) => {
    setStore((prev) => ({
      ...prev,
      mapImages: ensureRecord(prev.organizations, {
        ...prev.mapImages,
        [organizationId]: (prev.mapImages[organizationId] ?? []).filter((image) => image.id !== imageId),
      }),
    }))
  }

  const value = useMemo(
    () => ({
      data: store,
      updateOrganization,
      setMembers,
      setBusinesses,
      setEvidence,
      setMapImages,
      removeMember,
      removeBusiness,
      removeEvidence,
      removeMapImage,
    }),
    [store]
  )

  return <OrganizationDataContext.Provider value={value}>{children}</OrganizationDataContext.Provider>
}

export const useOrganizationData = () => {
  const context = useContext(OrganizationDataContext)
  if (!context) {
    throw new Error('useOrganizationData must be used within OrganizationDataProvider')
  }
  return context
}
