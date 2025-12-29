// VeryChat Messaging Service
// Provides chat room and messaging functionality

import type { ChatRoom, ChatMessage, SystemMessageType, SYSTEM_MESSAGE_TEMPLATES } from '@/lib/types/chat'

const VERYCHAT_API_URL = process.env.NEXT_PUBLIC_VERYCHAT_API_URL || 'https://gapi.veryapi.io'
const PROJECT_ID = process.env.NEXT_PUBLIC_VERYCHAT_PROJECT_ID

type MessageCallback = (message: ChatMessage) => void
type UnsubscribeFn = () => void

class VeryChatMessagingService {
  private projectId: string
  private accessToken: string | null = null
  private subscriptions: Map<string, WebSocket> = new Map()
  private messageCallbacks: Map<string, Set<MessageCallback>> = new Map()

  constructor() {
    this.projectId = PROJECT_ID || ''
  }

  setAccessToken(token: string | null) {
    this.accessToken = token
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' }
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`
    }
    return headers
  }

  /**
   * Create or get existing chat room for a job
   */
  async createJobChatRoom(jobId: string, participants: string[]): Promise<ChatRoom> {
    const response = await fetch(`${VERYCHAT_API_URL}/chat/rooms`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        projectId: this.projectId,
        externalId: `job-${jobId}`,
        participants,
        metadata: { jobId, type: 'pumasi-job' },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to create chat room')
    }

    const data = await response.json()
    return this.mapToChatRoom(data.data || data, jobId)
  }

  /**
   * Get chat room by job ID
   */
  async getJobChatRoom(jobId: string): Promise<ChatRoom | null> {
    const response = await fetch(
      `${VERYCHAT_API_URL}/chat/rooms/external/job-${jobId}?projectId=${this.projectId}`,
      { headers: this.getHeaders() }
    )

    if (response.status === 404) return null
    if (!response.ok) throw new Error('Failed to get chat room')

    const data = await response.json()
    return this.mapToChatRoom(data.data || data, jobId)
  }

  /**
   * Send a message to a chat room
   */
  async sendMessage(roomId: string, content: string, type: 'text' | 'file' = 'text'): Promise<ChatMessage> {
    const response = await fetch(`${VERYCHAT_API_URL}/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        projectId: this.projectId,
        content,
        type,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to send message')
    }

    const data = await response.json()
    return this.mapToChatMessage(data.data || data)
  }

  /**
   * Send a system message (auto-generated)
   */
  async sendSystemMessage(roomId: string, messageType: SystemMessageType): Promise<ChatMessage> {
    const templates: Record<SystemMessageType, string> = {
      job_started: '일자리가 시작되었습니다',
      deliverable_submitted: '납품물이 제출되었습니다',
      revision_requested: '수정이 요청되었습니다',
      job_completed: '일자리가 완료되었습니다',
      milestone_completed: '마일스톤이 완료되었습니다',
      payment_released: '결제가 완료되었습니다',
    }

    return this.sendMessage(roomId, templates[messageType], 'text')
  }

  /**
   * Get messages from a chat room
   */
  async getMessages(roomId: string, limit = 50, before?: string): Promise<ChatMessage[]> {
    const params = new URLSearchParams({
      projectId: this.projectId,
      limit: limit.toString(),
    })
    if (before) params.append('before', before)

    const response = await fetch(
      `${VERYCHAT_API_URL}/chat/rooms/${roomId}/messages?${params}`,
      { headers: this.getHeaders() }
    )

    if (!response.ok) throw new Error('Failed to get messages')

    const data = await response.json()
    const messages = data.data?.messages || data.messages || []
    return messages.map((msg: Record<string, unknown>) => this.mapToChatMessage(msg))
  }

  /**
   * Subscribe to real-time messages in a room
   */
  subscribeToRoom(roomId: string, callback: MessageCallback): UnsubscribeFn {
    // Add callback to the set
    if (!this.messageCallbacks.has(roomId)) {
      this.messageCallbacks.set(roomId, new Set())
    }
    this.messageCallbacks.get(roomId)!.add(callback)

    // Create WebSocket connection if not exists
    if (!this.subscriptions.has(roomId)) {
      this.connectWebSocket(roomId)
    }

    // Return unsubscribe function
    return () => {
      const callbacks = this.messageCallbacks.get(roomId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.disconnectWebSocket(roomId)
        }
      }
    }
  }

  private connectWebSocket(roomId: string) {
    const wsUrl = VERYCHAT_API_URL.replace('https://', 'wss://').replace('http://', 'ws://')
    const ws = new WebSocket(`${wsUrl}/chat/rooms/${roomId}/ws?token=${this.accessToken}`)

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          const message = this.mapToChatMessage(data.payload)
          this.messageCallbacks.get(roomId)?.forEach((cb) => cb(message))
        }
      } catch {
        console.error('Failed to parse WebSocket message')
      }
    }

    ws.onerror = () => console.error('WebSocket error for room:', roomId)
    ws.onclose = () => this.subscriptions.delete(roomId)

    this.subscriptions.set(roomId, ws)
  }

  private disconnectWebSocket(roomId: string) {
    const ws = this.subscriptions.get(roomId)
    if (ws) {
      ws.close()
      this.subscriptions.delete(roomId)
    }
    this.messageCallbacks.delete(roomId)
  }

  /**
   * Mark messages as read
   */
  async markAsRead(roomId: string, messageId: string): Promise<void> {
    await fetch(`${VERYCHAT_API_URL}/chat/rooms/${roomId}/read`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ projectId: this.projectId, lastReadMessageId: messageId }),
    })
  }

  /**
   * Upload a file and send as message
   */
  async sendFileMessage(roomId: string, file: File): Promise<ChatMessage> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('projectId', this.projectId)

    const uploadResponse = await fetch(`${VERYCHAT_API_URL}/chat/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.accessToken}` },
      body: formData,
    })

    if (!uploadResponse.ok) throw new Error('Failed to upload file')

    const uploadData = await uploadResponse.json()
    const fileUrl = uploadData.data?.url || uploadData.url

    return this.sendMessage(roomId, JSON.stringify({ fileUrl, fileName: file.name, fileSize: file.size }), 'file')
  }

  private mapToChatRoom(data: Record<string, unknown>, jobId: string): ChatRoom {
    return {
      id: data.id as string || data._id as string,
      jobId,
      participants: data.participants as string[] || [],
      createdAt: new Date(data.createdAt as string).getTime() || Date.now(),
      unreadCount: data.unreadCount as number || 0,
    }
  }

  private mapToChatMessage(data: Record<string, unknown>): ChatMessage {
    let content = data.content as string
    let fileUrl: string | undefined
    let fileName: string | undefined
    let fileSize: number | undefined

    // Parse file message content
    if (data.type === 'file' && typeof content === 'string') {
      try {
        const parsed = JSON.parse(content)
        fileUrl = parsed.fileUrl
        fileName = parsed.fileName
        fileSize = parsed.fileSize
        content = fileName || 'File'
      } catch {
        // Keep content as is
      }
    }

    return {
      id: data.id as string || data._id as string,
      roomId: data.roomId as string,
      sender: data.sender as string || data.senderId as string,
      senderName: data.senderName as string,
      senderImage: data.senderImage as string,
      content,
      timestamp: new Date(data.createdAt as string || data.timestamp as string).getTime() || Date.now(),
      type: (data.type as 'text' | 'file' | 'system') || 'text',
      fileUrl,
      fileName,
      fileSize,
      read: data.read as boolean ?? false,
    }
  }

  isConfigured(): boolean {
    return !!this.projectId
  }
}

export const verychatMessaging = new VeryChatMessagingService()
