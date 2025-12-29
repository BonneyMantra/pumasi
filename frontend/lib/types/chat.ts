// Chat Types for VeryChat Integration

export interface ChatRoom {
  id: string
  jobId: string
  participants: string[]
  createdAt: number
  lastMessage?: ChatMessage
  unreadCount?: number
}

export interface ChatMessage {
  id: string
  roomId: string
  sender: string
  senderName?: string
  senderImage?: string
  content: string
  timestamp: number
  type: 'text' | 'file' | 'system'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  read?: boolean
}

export type SystemMessageType =
  | 'job_started'
  | 'deliverable_submitted'
  | 'revision_requested'
  | 'job_completed'
  | 'milestone_completed'
  | 'payment_released'

export interface SystemMessageData {
  type: SystemMessageType
  jobId: string
  metadata?: Record<string, unknown>
}

export interface ChatState {
  room: ChatRoom | null
  messages: ChatMessage[]
  isLoading: boolean
  isSending: boolean
  error: string | null
  hasMore: boolean
}

export interface ChatConfig {
  maxMessageLength: number
  maxFileSize: number
  allowedFileTypes: string[]
}

export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  maxMessageLength: 2000,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedFileTypes: ['image/*', 'application/pdf', '.doc', '.docx', '.zip'],
}

// System message templates in Korean
export const SYSTEM_MESSAGE_TEMPLATES: Record<SystemMessageType, string> = {
  job_started: '일자리가 시작되었습니다',
  deliverable_submitted: '납품물이 제출되었습니다',
  revision_requested: '수정이 요청되었습니다',
  job_completed: '일자리가 완료되었습니다',
  milestone_completed: '마일스톤이 완료되었습니다',
  payment_released: '결제가 완료되었습니다',
}
