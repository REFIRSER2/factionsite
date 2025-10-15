import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Header } from '../../components/feature/Header'
import { Button } from '../../components/base/Button'
import { Input } from '../../components/base/Input'
import { useAccounts } from '../../context/AccountContext'
import type { Account, AccountRole } from '../../types/account'
import { AudioControls } from '../../components/feature/AudioControls'
import { LogoutButton } from '../../components/feature/LogoutButton'
import { useAudio } from '../../hooks/useAudio'

interface AccountFormState {
  id: string
  password: string
  name: string
  profileImage: string
  role: AccountRole
}

const emptyForm: AccountFormState = {
  id: '',
  password: '',
  name: '',
  profileImage: '',
  role: 'operator',
}

export default function AccountManagerPage() {
  const navigate = useNavigate()
  const { playClickSound, playTransitionSound } = useAudio()
  const { accounts, addAccount, removeAccount } = useAccounts()
  const [formState, setFormState] = useState<AccountFormState>(emptyForm)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<Account | null>(null)

  useEffect(() => {
    const stored = localStorage.getItem('vitalle-user')
    if (stored) {
      try {
        setCurrentUser(JSON.parse(stored) as Account)
      } catch {
        setCurrentUser(null)
      }
    }
  }, [])

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      navigate('/dashboard', { replace: true })
    }
  }, [currentUser, navigate])

  const isFormValid = useMemo(() => {
    return (
      formState.id.trim().length >= 3 &&
      formState.password.trim().length >= 6 &&
      formState.name.trim().length > 0 &&
      formState.profileImage.trim().length > 0
    )
  }, [formState])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    playClickSound()

    if (!isFormValid) {
      setFeedback('모든 필드를 올바르게 입력해 주세요.')
      return
    }

    const result = addAccount({ ...formState })
    if (!result.success) {
      setFeedback(result.message)
      return
    }

    setFeedback(`${formState.name} 계정을 생성했습니다.`)
    setFormState(emptyForm)
  }

  const handleRemove = (account: Account) => {
    playClickSound()
    if (account.role === 'admin') {
      setFeedback('관리자 계정은 삭제할 수 없습니다.')
      return
    }

    removeAccount(account.id)
    setFeedback(`${account.name} 계정을 삭제했습니다.`)
  }

  const handleBack = () => {
    playTransitionSound()
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Header currentPage="Management Console" />
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_rgba(0,0,0,0.85)_100%)]" />

      <div className="relative z-10 pt-24 pb-12 px-4 max-w-6xl mx-auto space-y-10">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold font-orbitron text-yellow-400">
            계정 관리 패널
          </h2>
          <Button variant="ghost" onClick={handleBack}>
            <i className="ri-arrow-go-back-line mr-2" /> 대시보드로 돌아가기
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 bg-gray-900/70 border border-yellow-400/30 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-yellow-400">새 계정 생성</h3>
              <p className="text-sm text-gray-400 mt-1">
                관리자는 여기서 신규 요원을 등록할 수 있습니다.
              </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="로그인 ID"
                placeholder="예: strategist"
                value={formState.id}
                onChange={(event) => setFormState((prev) => ({ ...prev, id: event.target.value }))}
              />

              <Input
                label="비밀번호"
                type="password"
                placeholder="최소 6자"
                value={formState.password}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, password: event.target.value }))
                }
              />

              <Input
                label="RP 이름"
                placeholder="이름 또는 코드네임"
                value={formState.name}
                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
              />

              <Input
                label="프로필 아이콘 URL"
                placeholder="이미지 링크를 붙여넣으세요"
                value={formState.profileImage}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, profileImage: event.target.value }))
                }
              />

              <div>
                <label className="block text-sm font-medium text-yellow-400 mb-2">역할</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['operator', 'admin'] as AccountRole[]).map((roleOption) => (
                    <button
                      type="button"
                      key={roleOption}
                      onClick={() => setFormState((prev) => ({ ...prev, role: roleOption }))}
                      className={`
                        px-3 py-2 rounded-lg border transition-all duration-200 font-medium text-sm
                        ${
                          formState.role === roleOption
                            ? 'border-yellow-400 text-yellow-300 bg-yellow-400/10'
                            : 'border-yellow-400/20 text-gray-400 hover:text-yellow-300'
                        }
                      `}
                    >
                      {roleOption === 'admin' ? '관리자' : '운영 요원'}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={!isFormValid}>
                계정 생성
              </Button>
            </form>

            {feedback && (
              <div className="text-sm text-yellow-300 bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-3">
                {feedback}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-yellow-400">등록된 계정</h3>
              <span className="text-sm text-gray-400">총 {accounts.length}명</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-gray-900/70 border border-yellow-400/20 rounded-xl p-5 flex space-x-4"
                >
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-yellow-400/40">
                    <img src={account.profileImage} alt={account.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-white">{account.name}</h4>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          account.role === 'admin'
                            ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/40'
                            : 'bg-gray-800 text-gray-300 border border-yellow-400/10'
                        }`}
                      >
                        {account.role === 'admin' ? '관리자' : '운영 요원'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>ID: {account.id}</p>
                      <p>비밀번호: {account.password}</p>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(account.profileImage)}
                      >
                        아이콘 URL 복사
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemove(account)}
                        disabled={account.role === 'admin'}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AudioControls />
      <LogoutButton />
    </div>
  )
}
