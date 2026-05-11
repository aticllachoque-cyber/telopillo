export type NetworkStatus = 'online' | 'offline' | 'reconnecting'

export interface NetworkStatusState {
  status: NetworkStatus
  isOnline: boolean
}
