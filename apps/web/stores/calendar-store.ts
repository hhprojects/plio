import { create } from 'zustand'

interface CalendarStoreState {
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  currentDate: Date
  selectedSessionId: string | null
  colorBy: 'service' | 'team_member'
  filters: {
    teamMemberId?: string
    serviceId?: string
    roomId?: string
  }
  setView: (view: CalendarStoreState['view']) => void
  setCurrentDate: (date: Date) => void
  selectSession: (id: string | null) => void
  setColorBy: (colorBy: 'service' | 'team_member') => void
  setFilters: (filters: CalendarStoreState['filters']) => void
}

export const useCalendarStore = create<CalendarStoreState>((set) => ({
  view: 'timeGridWeek',
  currentDate: new Date(),
  selectedSessionId: null,
  colorBy: 'service',
  filters: {},
  setView: (view) => set({ view }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  selectSession: (selectedSessionId) => set({ selectedSessionId }),
  setColorBy: (colorBy) => set({ colorBy }),
  setFilters: (filters) => set({ filters }),
}))
