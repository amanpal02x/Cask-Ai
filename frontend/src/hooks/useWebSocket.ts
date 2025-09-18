import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseWebSocketProps {
  userId: string;
  userRole: 'patient' | 'doctor';
  token: string;
}

interface WebSocketMessage {
  type: 'doctor_status_change' | 'patient_status_change' | 'notification' | 'relationship_message';
  data: any;
}

export const useWebSocket = ({ userId, userRole, token }: UseWebSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<{ [key: string]: boolean }>({});
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!userId || !userRole || !token) return;

    // Initialize socket connection
    const socket = io(process.env.REACT_APP_WS_URL || 'http://localhost:8000', {
      auth: {
        token,
        userId,
        userRole
      }
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('WebSocket connected');
      setIsConnected(true);
      
      // Authenticate with the server
      socket.emit('authenticate', {
        token,
        userId,
        userRole
      });
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    });

    socket.on('authenticated', (data) => {
      console.log('WebSocket authenticated:', data);
    });

    socket.on('authentication_error', (error) => {
      console.error('WebSocket authentication error:', error);
    });

    // Status change handlers
    socket.on('doctor_status_change', (data) => {
      console.log('Doctor status changed:', data);
      setOnlineUsers(prev => ({
        ...prev,
        [data.doctorId]: data.isOnline
      }));
    });

    socket.on('patient_status_change', (data) => {
      console.log('Patient status changed:', data);
      setOnlineUsers(prev => ({
        ...prev,
        [data.patientId]: data.isOnline
      }));
    });

    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      // You can emit a custom event or use a state management solution here
      window.dispatchEvent(new CustomEvent('websocket-notification', { detail: notification }));
    });

    socket.on('relationship_message', (message) => {
      console.log('Received relationship message:', message);
      window.dispatchEvent(new CustomEvent('websocket-message', { detail: message }));
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userRole, token]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(type, data);
    }
  }, [isConnected]);

  const joinRelationship = useCallback((relationshipId: string) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_relationship', { relationshipId });
    }
  }, [isConnected]);

  const updateStatus = useCallback((isOnline: boolean) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('update_status', { isOnline });
    }
  }, [isConnected]);

  return {
    isConnected,
    onlineUsers,
    sendMessage,
    joinRelationship,
    updateStatus
  };
};
