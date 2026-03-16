'use client'

import { Download, Share, X } from 'lucide-react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { Button } from '@/components/ui/button'

export function InstallPrompt() {
  const { canPrompt, isIOS, install, dismiss } = useInstallPrompt()

  if (!canPrompt) return null

  return (
    <div className="relative flex items-center gap-3 border-b border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm">
      <Download className="h-4 w-4 shrink-0 text-indigo-600" />
      {isIOS ? (
        <p className="flex-1 text-indigo-900">
          Install Plio: tap{' '}
          <Share className="inline h-3.5 w-3.5 align-text-bottom text-indigo-600" />{' '}
          Share then <span className="font-medium">&quot;Add to Home Screen&quot;</span>
        </p>
      ) : (
        <p className="flex-1 text-indigo-900">
          Install Plio for quick access from your home screen
        </p>
      )}
      {!isIOS && (
        <Button
          size="sm"
          variant="default"
          className="h-7 bg-indigo-600 px-3 text-xs hover:bg-indigo-700"
          onClick={install}
        >
          Install
        </Button>
      )}
      <button
        onClick={dismiss}
        className="shrink-0 rounded p-0.5 text-indigo-400 hover:text-indigo-600"
        aria-label="Dismiss install prompt"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
