'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './message-bubble'
import { ChatInput } from './chat-input'
import type { ChatMessage } from '@/lib/types/chat'
import { useTranslation } from '@/lib/i18n'

interface ChatContainerProps {
  messages: ChatMessage[]
  currentUserId: string
  isLoading?: boolean
  isSending?: boolean
  hasMore?: boolean
  onSend: (message: string) => Promise<void>
  onSendFile?: (file: File) => Promise<void>
  onLoadMore?: () => void
  emptyMessage?: string
  disabled?: boolean
}

export function ChatContainer({
  messages,
  currentUserId,
  isLoading = false,
  isSending = false,
  hasMore = false,
  onSend,
  onSendFile,
  onLoadMore,
  emptyMessage,
  disabled = false,
}: ChatContainerProps) {
  const { t } = useTranslation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const prevMessagesLength = useRef(messages.length)

  const displayEmptyMessage = emptyMessage || `${t('chat.noMessages')} ${t('chat.startConversation')}`

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevMessagesLength.current = messages.length
  }, [messages.length])

  // Handle scroll for loading more
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    if (target.scrollTop === 0 && hasMore && onLoadMore && !isLoading) {
      onLoadMore()
    }
  }

  const shouldShowSender = (msg: ChatMessage, idx: number) => {
    if (idx === 0) return true
    const prevMsg = messages[idx - 1]
    return prevMsg.sender !== msg.sender
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <ScrollArea
        ref={scrollRef}
        className="flex-1 px-4"
        onScroll={handleScroll}
      >
        {/* Loading more indicator */}
        {isLoading && hasMore && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full py-12">
            <p className="text-muted-foreground text-sm text-center">
              {displayEmptyMessage}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="py-4">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={message.sender === currentUserId}
              showSender={shouldShowSender(message, index)}
            />
          ))}
        </div>

        {/* Sending indicator */}
        {isSending && (
          <div className="flex justify-end mb-3">
            <div className="px-3 py-2 bg-sky/50 rounded-2xl rounded-br-sm">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            </div>
          </div>
        )}

        {/* Scroll anchor */}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input area */}
      <ChatInput
        onSend={onSend}
        onSendFile={onSendFile}
        disabled={disabled || isLoading}
      />
    </div>
  )
}
