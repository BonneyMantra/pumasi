'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ChatContainer } from './chat-container'
import { UnreadCounter } from './chat-notifications'
import { useJobChat } from '@/lib/hooks/use-job-chat'
import { useVeryChatAuth } from '@/lib/hooks/use-verychat-auth'
import { useTranslation } from '@/lib/i18n'
import { cn } from '@/lib/utils'

interface JobChatPanelProps {
  jobId: string
  clientAddress: string
  freelancerAddress: string
  currentUserAddress: string
}

export function JobChatPanel({
  jobId,
  clientAddress,
  freelancerAddress,
  currentUserAddress,
}: JobChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isFullScreen, setIsFullScreen] = useState(false)
  const { t } = useTranslation()

  const { accessToken, user, isAuthenticated } = useVeryChatAuth()

  const participants = [clientAddress, freelancerAddress].filter(Boolean)
  const currentUserId = user?.profileId || currentUserAddress

  const {
    room,
    messages,
    isLoading,
    isSending,
    error,
    hasMore,
    sendMessage,
    sendFile,
    loadMore,
    markAsRead,
  } = useJobChat(jobId, participants, {
    accessToken,
    currentUserId,
    autoConnect: isAuthenticated,
  })

  // Mark messages as read when chat is opened
  useEffect(() => {
    if (isOpen && messages.length > 0) {
      markAsRead()
    }
  }, [isOpen, messages.length, markAsRead])

  // Calculate unread count (messages after last read)
  const unreadCount = room?.unreadCount ?? 0

  // Not authenticated state
  if (!isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sky" />
            VeryChat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {t('chat.authRequired')}
          </p>
          <Button variant="outline" className="w-full" disabled>
            {t('chat.connectionRequired')}
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Mobile: Full screen sheet
  const MobileChatView = (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full relative">
          <MessageCircle className="h-4 w-4 mr-2" />
          {t('chat.openChat')}
          {unreadCount > 0 && (
            <UnreadCounter count={unreadCount} className="ml-2" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] p-0">
        <SheetHeader className="px-4 py-3 border-b">
          <SheetTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sky" />
            {t('chat.projectChat')}
          </SheetTitle>
        </SheetHeader>
        <div className="h-[calc(85vh-60px)]">
          <ChatContent
            messages={messages}
            currentUserId={currentUserId}
            isLoading={isLoading}
            isSending={isSending}
            hasMore={hasMore}
            error={error}
            onSend={sendMessage}
            onSendFile={sendFile}
            onLoadMore={loadMore}
          />
        </div>
      </SheetContent>
    </Sheet>
  )

  // Desktop: Expandable panel
  const DesktopChatView = (
    <Card className={cn(isFullScreen && 'fixed inset-4 z-50 max-w-none')}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-sky" />
            VeryChat
            {unreadCount > 0 && <UnreadCounter count={unreadCount} />}
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setIsFullScreen(!isFullScreen)}
            >
              {isFullScreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
            {isFullScreen && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setIsFullScreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn('p-0', isFullScreen ? 'h-[calc(100%-60px)]' : 'h-80')}>
        {!isOpen ? (
          <div className="p-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsOpen(true)}
            >
              {t('chat.startConversation')}
            </Button>
          </div>
        ) : (
          <ChatContent
            messages={messages}
            currentUserId={currentUserId}
            isLoading={isLoading}
            isSending={isSending}
            hasMore={hasMore}
            error={error}
            onSend={sendMessage}
            onSendFile={sendFile}
            onLoadMore={loadMore}
          />
        )}
      </CardContent>
    </Card>
  )

  // Auto-open on desktop
  useEffect(() => {
    const isDesktop = window.innerWidth >= 1024
    if (isDesktop && !isOpen) {
      setIsOpen(true)
    }
  }, [])

  return (
    <>
      {/* Mobile view */}
      <div className="lg:hidden">{MobileChatView}</div>
      {/* Desktop view */}
      <div className="hidden lg:block">{DesktopChatView}</div>
      {/* Fullscreen overlay */}
      {isFullScreen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
          onClick={() => setIsFullScreen(false)}
        />
      )}
    </>
  )
}

// Inner chat content component
function ChatContent({
  messages,
  currentUserId,
  isLoading,
  isSending,
  hasMore,
  error,
  onSend,
  onSendFile,
  onLoadMore,
}: {
  messages: ReturnType<typeof useJobChat>['messages']
  currentUserId: string
  isLoading: boolean
  isSending: boolean
  hasMore: boolean
  error: string | null
  onSend: (msg: string) => Promise<void>
  onSendFile: (file: File) => Promise<void>
  onLoadMore: () => Promise<void>
}) {
  const { t } = useTranslation()
  if (error) {
    return (
      <div className="flex items-center justify-center h-full p-4">
        <p className="text-sm text-destructive text-center">{error}</p>
      </div>
    )
  }

  if (isLoading && messages.length === 0) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-12 w-1/2 ml-auto" />
        <Skeleton className="h-12 w-2/3" />
      </div>
    )
  }

  return (
    <ChatContainer
      messages={messages}
      currentUserId={currentUserId}
      isLoading={isLoading}
      isSending={isSending}
      hasMore={hasMore}
      onSend={onSend}
      onSendFile={onSendFile}
      onLoadMore={onLoadMore}
      emptyMessage={t('chat.emptyMessage')}
    />
  )
}
