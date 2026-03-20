import { create } from 'zustand'

export interface CalendarInstanceData {
  id: string
  sessionId: string
  courseTitle: string
  date: string
  startTime: string
  endTime: string
  tutorName: string
  tutorId: string
  roomName: string | null
  roomId: string | null
  enrollmentCount: number
  status: string
  maxCapacity?: number
  overrideNotes?: string | null
  instanceId?: string
}

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
  selectedInstance: CalendarInstanceData | null
  setView: (view: CalendarStoreState['view']) => void
  setCurrentDate: (date: Date) => void
  selectSession: (id: string | null) => void
  selectInstance: (instance: CalendarInstanceData | null) => void
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
