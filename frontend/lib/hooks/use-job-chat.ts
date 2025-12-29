'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { verychatMessaging } from '@/lib/services/verychat-messaging'
import type { ChatRoom, ChatMessage, ChatState, SystemMessageType } from '@/lib/types/chat'

interface UseJobChatOptions {
  accessToken?: string | null
  currentUserId?: string
  autoConnect?: boolean
}

interface UseJobChatReturn extends ChatState {
  sendMessage: (content: string) => Promise<void>
  sendFile: (file: File) => Promise<void>
  sendSystemMessage: (type: SystemMessageType) => Promise<void>
  loadMore: () => Promise<void>
  refresh: () => Promise<void>
  markAsRead: () => Promise<void>
}

export function useJobChat(
  jobId: string,
  participants: string[],
  options: UseJobChatOptions = {}
): UseJobChatReturn {
  const { accessToken, currentUserId, autoConnect = true } = options

  const [state, setState] = useState<ChatState>({
    room: null,
    messages: [],
    isLoading: true,
    isSending: false,
    error: null,
    hasMore: false,
  })

  const unsubscribeRef = useRef<(() => void) | null>(null)
  const oldestMessageIdRef = useRef<string | undefined>(undefined)

  // Set access token
  useEffect(() => {
    if (accessToken) {
      verychatMessaging.setAccessToken(accessToken)
    }
  }, [accessToken])

  // Initialize chat room
  const initializeRoom = useCallback(async () => {
    if (!jobId || participants.length < 2) return

    setState((prev) => ({ ...prev, isLoading: true, error: null }))

    try {
      // Get or create room
      let room = await verychatMessaging.getJobChatRoom(jobId)

      if (!room) {
        room = await verychatMessaging.createJobChatRoom(jobId, participants)
      }

      // Load initial messages
      const messages = await verychatMessaging.getMessages(room.id, 50)

      if (messages.length > 0) {
        oldestMessageIdRef.current = messages[0].id
      }

      setState({
        room,
        messages: messages.reverse(), // Oldest first
        isLoading: false,
        isSending: false,
        error: null,
        hasMore: messages.length === 50,
      })

      // Subscribe to new messages
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }

      unsubscribeRef.current = verychatMessaging.subscribeToRoom(
        room.id,
        (newMessage) => {
          setState((prev) => ({
            ...prev,
            messages: [...prev.messages, newMessage],
          }))
        }
      )
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load chat',
      }))
    }
  }, [jobId, participants])

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect && accessToken) {
      initializeRoom()
    }

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [autoConnect, accessToken, initializeRoom])

  // Send text message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!state.room) return

      setState((prev) => ({ ...prev, isSending: true }))

      try {
        const message = await verychatMessaging.sendMessage(state.room.id, content)
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
          isSending: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Failed to send message',
        }))
        throw error
      }
    },
    [state.room]
  )

  // Send file message
  const sendFile = useCallback(
    async (file: File) => {
      if (!state.room) return

      setState((prev) => ({ ...prev, isSending: true }))

      try {
        const message = await verychatMessaging.sendFileMessage(state.room.id, file)
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
          isSending: false,
        }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSending: false,
          error: error instanceof Error ? error.message : 'Failed to send file',
        }))
        throw error
      }
    },
    [state.room]
  )

  // Send system message
  const sendSystemMessage = useCallback(
    async (type: SystemMessageType) => {
      if (!state.room) return

      try {
        await verychatMessaging.sendSystemMessage(state.room.id, type)
      } catch (error) {
        console.error('Failed to send system message:', error)
      }
    },
    [state.room]
  )

  // Load more messages
  const loadMore = useCallback(async () => {
    if (!state.room || !state.hasMore || state.isLoading) return

    setState((prev) => ({ ...prev, isLoading: true }))

    try {
      const olderMessages = await verychatMessaging.getMessages(
        state.room.id,
        50,
        oldestMessageIdRef.current
      )

      if (olderMessages.length > 0) {
        oldestMessageIdRef.current = olderMessages[0].id
      }

      setState((prev) => ({
        ...prev,
        messages: [...olderMessages.reverse(), ...prev.messages],
        isLoading: false,
        hasMore: olderMessages.length === 50,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to load messages',
      }))
    }
  }, [state.room, state.hasMore, state.isLoading])

  // Refresh chat
  const refresh = useCallback(() => {
    return initializeRoom()
  }, [initializeRoom])

  // Mark messages as read
  const markAsRead = useCallback(async () => {
    if (!state.room || state.messages.length === 0) return

    const lastMessage = state.messages[state.messages.length - 1]
    try {
      await verychatMessaging.markAsRead(state.room.id, lastMessage.id)
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }, [state.room, state.messages])

  return {
    ...state,
    sendMessage,
    sendFile,
    sendSystemMessage,
    loadMore,
    refresh,
    markAsRead,
  }
}
