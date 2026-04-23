import React, { useCallback, useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebSocket } from '../hooks/useWebSocket';
import apiService from '../services/api';
import { Paperclip, Send, MessageSquare, X } from 'lucide-react';

interface MessageItem {
  _id?: string;
  relationshipId: string;
  senderId: string;
  recipientId: string;
  text: string;
  timestamp: number;
  clientMessageId?: string;
  isRead?: boolean;
  readAt?: Date;
  deliveredAt?: Date;
}

interface ChatWidgetProps {
  className?: string;
}

export interface ChatWidgetRef {
  openChat: (relationshipId: string) => void;
}

const ChatWidget = forwardRef<ChatWidgetRef, ChatWidgetProps>((props, ref) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRelationshipId, setActiveRelationshipId] = useState<string | null>(null);
  const [composeText, setComposeText] = useState('');
  const [threads, setThreads] = useState<Record<string, MessageItem[]>>({});
  const [doctorPatients, setDoctorPatients] = useState<{ id: string; name: string; relationshipId?: string }[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [isTyping, setIsTyping] = useState(false);
  const [pendingMessages, setPendingMessages] = useState<Set<string>>(new Set());
  const listRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { 
    isConnected, 
    joinRelationship, 
    sendMessage, 
    sendTypingIndicator, 
    markMessagesAsRead, 
    loadChatHistory 
  } = useWebSocket({
    userId: user?.id || '',
    userRole: (user?.role as any) || 'patient',
    token: localStorage.getItem('authToken') || ''
  });

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    openChat: (relationshipId: string) => {
      setActiveRelationshipId(relationshipId);
      setIsOpen(true);
      joinRelationship(relationshipId);
    }
  }));

  // Load relationships for each role
  useEffect(() => {
    const load = async () => {
      if (!user) return;
      if (user.role === 'patient') {
        const res = await apiService.getPatientConnectionStatus();
        if (res.success && res.data?.relationshipId) {
          setActiveRelationshipId(res.data.relationshipId);
          joinRelationship(res.data.relationshipId);
          // Load chat history
          loadChatHistory(res.data.relationshipId);
        }
      } else if (user.role === 'doctor') {
        const res = await apiService.getPatients();
        if (res.success) {
          setDoctorPatients(res.data || []);
          // Auto-select first thread if none
          const first = (res.data || []).find(p => p.relationshipId);
          if (!activeRelationshipId && first?.relationshipId) {
            setActiveRelationshipId(first.relationshipId);
            joinRelationship(first.relationshipId);
            // Load chat history
            loadChatHistory(first.relationshipId);
          }
        }
      }
    };
    load();
  }, [user, joinRelationship, activeRelationshipId, loadChatHistory]);

  // Handle incoming messages
  useEffect(() => {
    const messageHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const msg = e.detail as MessageItem;
      if (!msg?.relationshipId) return;
      
      setThreads(prev => {
        const list = prev[msg.relationshipId] || [];
        // Check if message already exists (prevent duplicates)
        const exists = list.some(m => 
          m.clientMessageId === msg.clientMessageId || 
          (m._id && m._id === msg._id)
        );
        if (exists) return prev;
        
        return { ...prev, [msg.relationshipId]: list.concat(msg) };
      });
      
      // Remove from pending if it was a pending message
      if (msg.clientMessageId) {
        setPendingMessages(prev => {
          const newSet = new Set(prev);
          newSet.delete(msg.clientMessageId!);
          return newSet;
        });
      }
      
      // Auto-open when a new message arrives for this user
      if (!isOpen) setIsOpen(true);
      // Scroll to bottom
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    };

    const chatHistoryHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const { relationshipId, messages } = e.detail;
      if (!relationshipId || !messages) return;
      
      setThreads(prev => ({
        ...prev,
        [relationshipId]: messages
      }));
      
      // Scroll to bottom after loading history
      setTimeout(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      }, 0);
    };

    const typingHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const { relationshipId, senderId, isTyping } = e.detail;
      if (!relationshipId || !senderId || senderId === user?.id) return;
      
      setTypingUsers(prev => {
        const current = prev[relationshipId] || [];
        if (isTyping) {
          return {
            ...prev,
            [relationshipId]: current.filter(id => id !== senderId).concat(senderId)
          };
        } else {
          return {
            ...prev,
            [relationshipId]: current.filter(id => id !== senderId)
          };
        }
      });
    };

    const readReceiptHandler = (evt: Event) => {
      const e = evt as CustomEvent;
      const { relationshipId, messageIds } = e.detail;
      if (!relationshipId || !messageIds) return;
      
      setThreads(prev => {
        const list = prev[relationshipId] || [];
        const updated = list.map(msg => 
          messageIds.includes(msg._id || '') ? { ...msg, isRead: true, readAt: new Date() } : msg
        );
        return { ...prev, [relationshipId]: updated };
      });
    };

    window.addEventListener('websocket-message', messageHandler as EventListener);
    window.addEventListener('websocket-chat-history', chatHistoryHandler as EventListener);
    window.addEventListener('websocket-typing', typingHandler as EventListener);
    window.addEventListener('websocket-messages-read', readReceiptHandler as EventListener);
    
    return () => {
      window.removeEventListener('websocket-message', messageHandler as EventListener);
      window.removeEventListener('websocket-chat-history', chatHistoryHandler as EventListener);
      window.removeEventListener('websocket-typing', typingHandler as EventListener);
      window.removeEventListener('websocket-messages-read', readReceiptHandler as EventListener);
    };
  }, [isOpen, user?.id]);

  const currentThread = useMemo(() => (activeRelationshipId ? threads[activeRelationshipId] || [] : []), [threads, activeRelationshipId]);

  const canSend = isConnected && activeRelationshipId && composeText.trim().length > 0;

  const handleSend = useCallback(() => {
    if (!user || !activeRelationshipId || !composeText.trim()) return;
    const text = composeText.trim();
    const clientMessageId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    // Add to pending messages to show loading state
    setPendingMessages(prev => {
      const newSet = new Set(prev);
      newSet.add(clientMessageId);
      return newSet;
    });
    
    // Create temporary message for immediate UI feedback
    const temp: MessageItem = {
      relationshipId: activeRelationshipId,
      senderId: user.id,
      recipientId: 'unknown',
      text,
      timestamp: Date.now(),
      clientMessageId,
      isRead: false
    };
    
    setThreads(prev => ({
      ...prev,
      [activeRelationshipId]: (prev[activeRelationshipId] || []).concat(temp)
    }));
    setComposeText('');
    
    // Stop typing indicator
    if (isTyping) {
      sendTypingIndicator(activeRelationshipId, false);
      setIsTyping(false);
    }
    
    sendMessage('relationship_send', {
      relationshipId: activeRelationshipId,
      senderId: user.id,
      // recipientId is resolved server-side via room membership
      recipientId: '',
      text,
      clientMessageId
    });
  }, [user, activeRelationshipId, composeText, sendMessage, sendTypingIndicator, isTyping]);

  // Doctor: switch threads
  const handlePickPatient = (relationshipId?: string) => {
    if (!relationshipId) return;
    setActiveRelationshipId(relationshipId);
    joinRelationship(relationshipId);
    // Load chat history for the new relationship
    loadChatHistory(relationshipId);
  };

  // Handle typing indicator
  const handleTyping = useCallback((text: string) => {
    if (!activeRelationshipId) return;
    
    const isCurrentlyTyping = text.trim().length > 0;
    
    if (isCurrentlyTyping && !isTyping) {
      setIsTyping(true);
      sendTypingIndicator(activeRelationshipId, true);
    } else if (!isCurrentlyTyping && isTyping) {
      setIsTyping(false);
      sendTypingIndicator(activeRelationshipId, false);
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator
    if (isCurrentlyTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(activeRelationshipId, false);
      }, 2000);
    }
  }, [activeRelationshipId, isTyping, sendTypingIndicator]);

  // Mark messages as read when chat is opened or scrolled to bottom
  useEffect(() => {
    if (!activeRelationshipId || !isOpen) return;
    
    const unreadMessages = currentThread.filter(msg => 
      msg.recipientId === user?.id && !msg.isRead && msg._id
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id!);
      markMessagesAsRead(activeRelationshipId, messageIds);
    }
  }, [activeRelationshipId, isOpen, currentThread, user?.id, markMessagesAsRead]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicking outside to close chat
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen) {
        const target = event.target as Element;
        const chatWidget = target.closest('[data-chat-widget]');
        const chatButton = target.closest('[data-chat-button]');
        
        // Close chat if clicking outside both the chat widget and the chat button
        if (!chatWidget && !chatButton) {
          setIsOpen(false);
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <button
        onClick={() => setIsOpen(s => !s)}
        className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg bg-primary-600 text-white h-12 w-12 flex items-center justify-center hover:bg-primary-700"
        title="Chat"
        data-chat-button
      >
        {isOpen ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 z-40 w-96 max-w-[96vw] bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
          data-chat-widget
        >
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <div className="font-semibold text-gray-800">{user?.role === 'doctor' ? 'Patient Messages' : 'Doctor Messages'}</div>
            <div className="text-xs text-gray-500">{isConnected ? 'Online' : 'Connecting…'}</div>
          </div>

          <div className="flex">
            {user?.role === 'doctor' && (
              <div className="w-40 border-r max-h-96 overflow-y-auto">
                {doctorPatients.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePickPatient(p.relationshipId)}
                    disabled={!p.relationshipId}
                    className={`w-full text-left px-3 py-2 text-sm border-b hover:bg-gray-50 ${
                      activeRelationshipId === p.relationshipId ? 'bg-primary-50 text-primary-700' : 'text-gray-700'
                    } ${!p.relationshipId ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 flex flex-col">
              <div ref={listRef} className="max-h-96 overflow-y-auto p-3 space-y-2 bg-white">
                {currentThread.map((m, idx) => {
                  const mine = m.senderId === user?.id;
                  const isPending = pendingMessages.has(m.clientMessageId || '');
                  return (
                    <div key={m._id || m.clientMessageId || m.timestamp || idx} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`px-3 py-2 rounded-lg text-sm shadow-sm ${mine ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-800'} ${isPending ? 'opacity-70' : ''}`}>
                        <div>{m.text}</div>
                        <div className={`mt-1 text-[10px] flex items-center gap-1 ${mine ? 'text-primary-100' : 'text-gray-500'}`}>
                          <span>{new Date(m.timestamp).toLocaleTimeString()}</span>
                          {mine && (
                            <span className="flex items-center">
                              {isPending ? (
                                <span className="text-xs">Sending...</span>
                              ) : m.isRead ? (
                                <span className="text-xs">✓✓</span>
                              ) : (
                                <span className="text-xs">✓</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {/* Typing indicator */}
                {activeRelationshipId && typingUsers[activeRelationshipId] && typingUsers[activeRelationshipId].length > 0 && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-lg text-sm bg-gray-100 text-gray-600">
                      <div className="flex items-center gap-1">
                        <span>Someone is typing</span>
                        <div className="flex gap-1">
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {currentThread.length === 0 && (
                  <div className="text-xs text-gray-500 text-center py-8">Start a conversation…</div>
                )}
              </div>

              <div className="border-t p-2 flex items-center gap-2">
                <button className="p-2 text-gray-500 hover:text-gray-700" title="Attach">
                  <Paperclip className="h-4 w-4" />
                </button>
                <input
                  value={composeText}
                  onChange={(e) => {
                    setComposeText(e.target.value);
                    handleTyping(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (canSend) handleSend();
                    }
                  }}
                  className="flex-1 text-sm px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-200"
                  placeholder="Type a message"
                />
                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`px-3 py-2 rounded-md text-white flex items-center gap-2 ${canSend ? 'bg-primary-600 hover:bg-primary-700' : 'bg-gray-300 cursor-not-allowed'}`}
                >
                  <Send className="h-4 w-4" />
                  <span className="text-xs">Send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

ChatWidget.displayName = 'ChatWidget';

export default ChatWidget;


