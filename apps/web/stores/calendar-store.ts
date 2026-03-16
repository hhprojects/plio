import { create } from 'zustand'

export interface CalendarStoreState {
  view: 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay'
  currentDate: Date
  selectedSessionId: string | null
  colorBy: 'service' | 'team_member'
  filters: {
    teamMemberId?: string
    serviceId?: string
    roomId?: string
  }
  // Detail panel state
  isDetailPanelOpen: boolean
  selectedInstance: Record<string, unknown> | null
  setView: (view: CalendarStoreState['view']) => void
  setCurrentDate: (date: Date) => void
  selectSession: (id: string | null) => void
  selectInstance: (instance: Record<string, unknown> | null) => void
  toggleDetailPanel: (open?: boolean) => void
  setColorBy: (colorBy: 'service' | 'team_member') => void
  setFilters: (filters: CalendarStoreState['filters']) => void
}

export const useCalendarStore = create<CalendarStoreState>((set) => ({
  view: 'timeGridWeek',
  currentDate: new Date(),
  selectedSessionId: null,
  colorBy: 'service',
  filters: {},
  isDetailPanelOpen: false,
  selectedInstance: null,
  setView: (view) => set({ view }),
  setCurrentDate: (currentDate) => set({ currentDate }),
  selectSession: (selectedSessionId) => set({ selectedSessionId }),
  selectInstance: (instance) =>
    set({
      selectedInstance: instance,
      isDetailPanelOpen: instance !== null,
    }),
  toggleDetailPanel: (open) =>
    set((state) => ({
      isDetailPanelOpen: open ?? !state.isDetailPanelOpen,
    })),
  setColorBy: (colorBy) => set({ colorBy }),
  setFilters: (filters) => set({ filters }),
}))
