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
} from '../types/organization'

interface OrganizationDataContextValue {
  data: OrganizationDataStore
  updateOrganization: (organizationId: string, updates: Partial<Organization>) => void
  setMembers: (organizationId: string, nextMembers: Member[]) => void
  setBusinesses: (organizationId: string, nextBusinesses: Business[]) => void
  setEvidence: (organizationId: string, nextEvidence: EvidenceItem[]) => void
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

  const value = useMemo(
    () => ({ data: store, updateOrganization, setMembers, setBusinesses, setEvidence }),
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
