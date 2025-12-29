'use client'

import { FileText, Download } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'
import { ko, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/lib/types/chat'

interface MessageBubbleProps {
  message: ChatMessage
  isOwn: boolean
  showSender?: boolean
}

export function MessageBubble({ message, isOwn, showSender = false }: MessageBubbleProps) {
  const { t, language } = useTranslation()

  const formatTime = (timestamp: number) => {
    const locale = language === 'ko' ? 'ko-KR' : 'en-US'
    return new Date(timestamp).toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // System message
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex mb-3', isOwn ? 'justify-end' : 'justify-start')}>
      <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        {/* Sender name */}
        {showSender && !isOwn && message.senderName && (
          <p className="text-xs text-muted-foreground mb-1 ml-1">
            {message.senderName}
          </p>
        )}

        {/* Message content */}
        <div
          className={cn(
            'px-3 py-2 rounded-2xl break-words',
            isOwn
              ? 'bg-sky text-white rounded-br-sm'
              : 'bg-muted rounded-bl-sm'
          )}
        >
          {message.type === 'file' ? (
            <FileMessageContent
              fileUrl={message.fileUrl}
              fileName={message.fileName}
              fileSize={message.fileSize}
              isOwn={isOwn}
            />
          ) : (
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          )}
        </div>

        {/* Timestamp */}
        <p
          className={cn(
            'text-[10px] text-muted-foreground mt-1',
            isOwn ? 'text-right mr-1' : 'ml-1'
          )}
        >
          {formatTime(message.timestamp)}
          {isOwn && message.read && (
            <span className="ml-1 text-sky">{t('chat.read')}</span>
          )}
        </p>
      </div>
    </div>
  )
}

function FileMessageContent({
  fileUrl,
  fileName,
  fileSize,
  isOwn,
}: {
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isOwn: boolean
}) {
  const { t } = useTranslation()

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const isImage = fileName?.match(/\.(jpg|jpeg|png|gif|webp)$/i)

  if (isImage && fileUrl) {
    return (
      <a href={fileUrl} target="_blank" rel="noopener noreferrer">
        <img
          src={fileUrl}
          alt={fileName}
          className="max-w-full rounded-lg max-h-48 object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        isOwn ? 'bg-white/10' : 'bg-background/50'
      )}
    >
      <FileText className="h-8 w-8 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{fileName || t('chat.file')}</p>
        {fileSize && (
          <p className={cn('text-xs', isOwn ? 'text-white/70' : 'text-muted-foreground')}>
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      <Download className="h-4 w-4 flex-shrink-0" />
    </a>
  )
}
