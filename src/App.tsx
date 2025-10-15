import { Suspense } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './router'
import { AccountProvider } from './context/AccountContext'
import { OrganizationDataProvider } from './context/OrganizationDataContext'

function App() {
  return (
    <AccountProvider>
      <OrganizationDataProvider>
        <BrowserRouter basename={__BASE_PATH__}>
          <Suspense
            fallback={(
              <div className="min-h-screen bg-black flex items-center justify-center text-yellow-400 font-orbitron">
                INITIALIZING INTERFACE...
              </div>
            )}
          >
            <AppRoutes />
          </Suspense>
        </BrowserRouter>
      </OrganizationDataProvider>
    </AccountProvider>
  )
}

export default App
