import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark' | 'system'
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  sidebarOpen: boolean
  toggleSidebar: () => void
  searchOpen: boolean
  setSearchOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()((set) => ({
  theme: 'system',
  setTheme: (theme) => set({ theme }),
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  searchOpen: false,
  setSearchOpen: (open) => set({ searchOpen: open }),
}))