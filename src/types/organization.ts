export type OrganizationRelationship = 'center' | 'friendly' | 'hostile' | 'neutral'

export interface OrganizationActivity {
  image: string
  description: string
}

export interface Organization {
  id: string
  name: string
  logo: string
  relationship: OrganizationRelationship
  color: string
  description: string
  location: string
  activities: OrganizationActivity[]
}

export interface Member {
  id: string
  name: string
  rank: string
  photo: string
  age: number
  vehicle: string
  notes: string
}

export interface Business {
  id: string
  name: string
  image1: string
  image2?: string
  address: string
  employees: number
  products: string
  legalOwner: string
  actualOwner: string
}

export interface EvidenceItem {
  id: string
  used: boolean
  target: string
  location: string
  additionalPersons: string
  details: string
  images: string[]
}

export interface OrganizationDataStore {
  organizations: Organization[]
  members: Record<string, Member[]>
  businesses: Record<string, Business[]>
  evidence: Record<string, EvidenceItem[]>
}
