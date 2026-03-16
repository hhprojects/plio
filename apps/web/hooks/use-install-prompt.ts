'use client'

import { useEffect, useState, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed this session
    if (sessionStorage.getItem('plio-install-dismissed')) {
      setDismissed(true)
    }

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setIsInstalled(true)
      return
    }

    // Detect iOS
    const ua = navigator.userAgent
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(isiOS)

    // Listen for the beforeinstallprompt event (Chromium browsers)
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // Listen for successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
    })

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
    }
  }, [])

  const install = useCallback(async () => {
    if (!deferredPrompt) return false
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    setDeferredPrompt(null)
    if (outcome === 'accepted') {
      setIsInstalled(true)
      return true
    }
    return false
  }, [deferredPrompt])

  const dismiss = useCallback(() => {
    setDismissed(true)
    sessionStorage.setItem('plio-install-dismissed', '1')
  }, [])

  const canPrompt = !isInstalled && !dismissed && (!!deferredPrompt || isIOS)

  return { canPrompt, isIOS, install, dismiss }
}
