import React, { Suspense } from 'react'
import ErrorBoundary from './components/Layout/ErrorBoundary'
import OfflineBanner from './components/Layout/OfflineBanner'
import LoadingScreen from './components/Layout/LoadingScreen'
import { useOnlineStatus } from './hooks/useOnlineStatus'

// Lazy load MapView to split the heavy Leaflet and map components
const MapView = React.lazy(() => import('./components/Map/MapView'))

function App() {
  const { isOnline } = useOnlineStatus()

  return (
    <ErrorBoundary>
      <div className="h-dvh w-full overflow-hidden">
        {!isOnline && (
          <OfflineBanner
            isOffline={true}
            onRefresh={() => window.location.reload()}
          />
        )}
        <Suspense fallback={<LoadingScreen />}>
          <MapView />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App
