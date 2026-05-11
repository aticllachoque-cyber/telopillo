'use client'

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { NetworkStatusState } from '@/lib/network/status'

const RECONNECTING_BANNER_MS = 3500

const NetworkStatusContext = createContext<NetworkStatusState>({
  status: 'online',
  isOnline: true,
})

export function useNetworkStatus() {
  return useContext(NetworkStatusContext)
}

function getInitialStatus(): NetworkStatusState {
  if (typeof window === 'undefined') {
    return { status: 'online', isOnline: true }
  }

  const online = window.navigator.onLine
  return {
    status: online ? 'online' : 'offline',
    isOnline: online,
  }
}

export function NetworkStatusProvider({ children }: { children: ReactNode }) {
  const [networkState, setNetworkState] = useState<NetworkStatusState>(getInitialStatus)
  const reconnectingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleOffline = () => {
      if (reconnectingTimerRef.current) {
        clearTimeout(reconnectingTimerRef.current)
        reconnectingTimerRef.current = null
      }

      setNetworkState({
        status: 'offline',
        isOnline: false,
      })
    }

    const handleOnline = () => {
      setNetworkState({
        status: 'reconnecting',
        isOnline: true,
      })

      if (reconnectingTimerRef.current) {
        clearTimeout(reconnectingTimerRef.current)
      }

      reconnectingTimerRef.current = setTimeout(() => {
        setNetworkState({
          status: 'online',
          isOnline: true,
        })
        reconnectingTimerRef.current = null
      }, RECONNECTING_BANNER_MS)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)

    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
      if (reconnectingTimerRef.current) {
        clearTimeout(reconnectingTimerRef.current)
      }
    }
  }, [])

  const value = useMemo(() => networkState, [networkState])

  return <NetworkStatusContext.Provider value={value}>{children}</NetworkStatusContext.Provider>
}
