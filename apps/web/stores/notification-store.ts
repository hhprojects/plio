import { create } from 'zustand'

interface NotificationStoreState {
  unreadCount: number
  setUnreadCount: (count: number) => void
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}))
