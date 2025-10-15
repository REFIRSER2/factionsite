export type AccountRole = 'admin' | 'operator'

export interface Account {
  id: string
  password: string
  name: string
  profileImage: string
  role: AccountRole
}
