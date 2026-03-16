'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface WhatsAppLinkProps {
  phone: string
  parentName: string
  studentName: string
  variant?: 'default' | 'icon'
}

function buildWhatsAppUrl(phone: string, parentName: string, studentName: string): string {
  // Remove '+' and any spaces/dashes from the phone number
  const cleanPhone = phone.replace(/[+\s-]/g, '')
  const message = `Hi ${parentName}, regarding ${studentName}...`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
}

export function WhatsAppLink({
  phone,
  parentName,
  studentName,
  variant = 'icon',
}: WhatsAppLinkProps) {
  const url = buildWhatsAppUrl(phone, parentName, studentName)

  if (variant === 'default') {
    return (
      <Button variant="outline" size="sm" asChild>
        <a href={url} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          WhatsApp
        </a>
      </Button>
    )
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="h-4 w-4 text-green-600" />
              <span className="sr-only">WhatsApp {parentName}</span>
            </a>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>WhatsApp {parentName}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
