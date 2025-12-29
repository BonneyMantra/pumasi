'use client'

import { useState, useRef, KeyboardEvent, ChangeEvent } from 'react'
import { Send, Paperclip, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { DEFAULT_CHAT_CONFIG } from '@/lib/types/chat'
import { useTranslation } from '@/lib/i18n'

interface ChatInputProps {
  onSend: (message: string) => Promise<void>
  onSendFile?: (file: File) => Promise<void>
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export function ChatInput({
  onSend,
  onSendFile,
  disabled = false,
  placeholder,
  maxLength = DEFAULT_CHAT_CONFIG.maxMessageLength,
}: ChatInputProps) {
  const { t } = useTranslation()
  const [message, setMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const displayPlaceholder = placeholder || t('chat.typeMessage')

  const handleSubmit = async () => {
    if (isSending || disabled) return

    // Send file if selected
    if (selectedFile && onSendFile) {
      setIsSending(true)
      try {
        await onSendFile(selectedFile)
        setSelectedFile(null)
      } catch (error) {
        console.error('Failed to send file:', error)
      } finally {
        setIsSending(false)
      }
      return
    }

    // Send text message
    const trimmed = message.trim()
    if (!trimmed) return

    setIsSending(true)
    try {
      await onSend(trimmed)
      setMessage('')
      textareaRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (not Shift+Enter)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    if (value.length <= maxLength) {
      setMessage(value)
    }
  }

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size
    if (file.size > DEFAULT_CHAT_CONFIG.maxFileSize) {
      alert(t('errors.fileTooLarge') || 'File size cannot exceed 10MB')
      return
    }

    setSelectedFile(file)
    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removeFile = () => {
    setSelectedFile(null)
  }

  const charCount = message.length
  const isNearLimit = charCount > maxLength * 0.9

  return (
    <div className="border-t bg-background p-4">
      {/* File preview */}
      {selectedFile && (
        <div className="mb-2 flex items-center gap-2 p-2 bg-muted rounded-lg">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          <span className="flex-1 text-sm truncate">{selectedFile.name}</span>
          <span className="text-xs text-muted-foreground">
            {(selectedFile.size / 1024).toFixed(1)} KB
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={removeFile}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="flex gap-2 items-end">
        {/* File attachment */}
        {onSendFile && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={DEFAULT_CHAT_CONFIG.allowedFileTypes.join(',')}
              onChange={handleFileSelect}
              disabled={disabled || isSending}
            />
            <Button
              variant="ghost"
              size="icon"
              className="flex-shrink-0"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isSending}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Text input */}
        <div className="flex-1 relative">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={displayPlaceholder}
            disabled={disabled || isSending || !!selectedFile}
            className="min-h-[44px] max-h-32 resize-none pr-12"
            rows={1}
          />
          {isNearLimit && (
            <span className="absolute bottom-1 right-2 text-xs text-muted-foreground">
              {charCount}/{maxLength}
            </span>
          )}
        </div>

        {/* Send button */}
        <Button
          size="icon"
          className="flex-shrink-0 bg-sky hover:bg-sky/90"
          onClick={handleSubmit}
          disabled={disabled || isSending || (!message.trim() && !selectedFile)}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  )
}
