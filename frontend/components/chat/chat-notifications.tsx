'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types/chat'

interface ChatNotificationsProps {
  unreadCount: number
  lastMessage?: ChatMessage
  onClick?: () => void
  onDismiss?: () => void
  showToast?: boolean
  enableSound?: boolean
}

export function ChatNotifications({
  unreadCount,
  lastMessage,
  onClick,
  onDismiss,
  showToast = true,
  enableSound = false,
}: ChatNotificationsProps) {
  const [toastVisible, setToastVisible] = useState(false)
  const [lastShownMessageId, setLastShownMessageId] = useState<string | null>(null)
  const { t } = useTranslation()

  // Play notification sound
  const playSound = useCallback(() => {
    if (!enableSound) return
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.5
      audio.play().catch(() => {})
    } catch {
      // Ignore audio errors
    }
  }, [enableSound])

  // Show toast for new messages
  useEffect(() => {
    if (
      showToast &&
      lastMessage &&
      lastMessage.id !== lastShownMessageId &&
      lastMessage.type !== 'system'
    ) {
      setLastShownMessageId(lastMessage.id)
      setToastVisible(true)
      playSound()

      // Auto-hide after 5 seconds
      const timer = setTimeout(() => {
        setToastVisible(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [lastMessage, lastShownMessageId, showToast, playSound])

  const handleDismissToast = () => {
    setToastVisible(false)
    onDismiss?.()
  }

  const truncateMessage = (content: string, maxLength = 50) => {
    if (content.length <= maxLength) return content
    return content.slice(0, maxLength) + '...'
  }

  return (
    <>
      {/* Notification badge button */}
      <Button
        variant="outline"
        size="icon"
        className="relative"
        onClick={onClick}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Toast notification */}
      {toastVisible && lastMessage && (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50',
            'max-w-sm w-full bg-background border rounded-lg shadow-lg',
            'animate-in slide-in-from-right-full fade-in duration-300'
          )}
        >
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {lastMessage.senderName || t('chat.notifications.newMessage')}
                </p>
                <p className="text-sm text-muted-foreground truncate">
                  {lastMessage.type === 'file'
                    ? t('chat.fileSent')
                    : truncateMessage(lastMessage.content)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 flex-shrink-0"
                onClick={handleDismissToast}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1 bg-sky hover:bg-sky/90"
                onClick={() => {
                  setToastVisible(false)
                  onClick?.()
                }}
              >
                {t('chat.openChat')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDismissToast}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Unread counter component for sidebar/header
interface UnreadCounterProps {
  count: number
  className?: string
}

export function UnreadCounter({ count, className }: UnreadCounterProps) {
  if (count === 0) return null

  return (
    <Badge
      variant="destructive"
      className={cn(
        'h-5 min-w-[20px] px-1.5 flex items-center justify-center text-xs',
        className
      )}
    >
      {count > 99 ? '99+' : count}
    </Badge>
  )
}
