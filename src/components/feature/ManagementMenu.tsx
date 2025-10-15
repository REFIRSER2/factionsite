import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '../base/Modal'
import { Button } from '../base/Button'
import { useAudio } from '../../hooks/useAudio'
import type { Account } from '../../types/account'

export const ManagementMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<Account | null>(null)
  const navigate = useNavigate()
  const { playClickSound, playTransitionSound } = useAudio()

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

  if (!currentUser || currentUser.role !== 'admin') {
    return null
  }

  const openMenu = () => {
    playClickSound()
    setIsOpen(true)
  }

  const closeMenu = () => {
    playClickSound()
    setIsOpen(false)
  }

  const goToAccounts = () => {
    playTransitionSound()
    setIsOpen(false)
    navigate('/admin/accounts')
  }

  return (
    <>
      <button
        onClick={openMenu}
        className="fixed bottom-4 left-20 z-30 p-3 bg-gray-900/80 border border-yellow-400/30 rounded-lg text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/80 transition-all duration-200"
        title="관리 메뉴"
      >
        <i className="ri-settings-4-line text-lg" />
      </button>

      <Modal isOpen={isOpen} onClose={closeMenu} size="sm">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <div className="text-yellow-400 text-3xl">⚙️</div>
            <h2 className="text-xl font-semibold text-white font-orbitron">관리자 도구</h2>
            <p className="text-gray-400 text-sm">시스템 계정과 조직 데이터를 관리합니다.</p>
          </div>

          <div className="space-y-3">
            <Button variant="secondary" className="w-full" onClick={goToAccounts}>
              <i className="ri-user-settings-line mr-2" /> 계정 관리 패널 이동
            </Button>
          </div>

          <Button variant="ghost" className="w-full" onClick={closeMenu}>
            닫기
          </Button>
        </div>
      </Modal>
    </>
  )
}
