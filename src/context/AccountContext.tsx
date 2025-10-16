import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react'
import { users as userSeed } from '../mocks/users'
import type { Account } from '../types/account'

interface AccountContextValue {
  accounts: Account[]
  addAccount: (account: Account) => { success: true } | { success: false; message: string }
  updateAccount: (id: string, updates: Partial<Omit<Account, 'id'>>) => void
  removeAccount: (id: string) => void
}

const STORAGE_KEY = 'vitalle-accounts'

const AccountContext = createContext<AccountContextValue | undefined>(undefined)

const loadInitialAccounts = (): Account[] => {
  if (typeof window === 'undefined') {
    return userSeed
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as Account[]
      if (Array.isArray(parsed) && parsed.length) {
        return parsed
      }
    } catch (error) {
      console.warn('Failed to parse stored accounts, fallback to seed data.', error)
    }
  }

  return userSeed
}

export const AccountProvider = ({ children }: { children: ReactNode }) => {
  const [accounts, setAccounts] = useState<Account[]>(loadInitialAccounts)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts))
    }
  }, [accounts])

  const addAccount: AccountContextValue['addAccount'] = (account) => {
    const exists = accounts.some((existing) => existing.id.toLowerCase() === account.id.toLowerCase())
    if (exists) {
      return { success: false, message: '이미 존재하는 ID입니다.' }
    }

    setAccounts((prev) => [...prev, account])
    return { success: true }
  }

  const updateAccount: AccountContextValue['updateAccount'] = (id, updates) => {
    setAccounts((prev) =>
      prev.map((account) => (account.id === id ? { ...account, ...updates } : account))
    )
  }

  const removeAccount: AccountContextValue['removeAccount'] = (id) => {
    setAccounts((prev) => prev.filter((account) => account.id !== id))
  }

  const value = useMemo(() => ({ accounts, addAccount, updateAccount, removeAccount }), [accounts])

  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
}

export const useAccounts = () => {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccounts must be used within AccountProvider')
  }
  return context
}
