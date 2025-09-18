import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  CheckCircle,
  X,
  Clock,
  Users,
  MessageSquare
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

interface ConnectionRequest {
  id: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  patientAvatar?: string;
  assignmentReason: string;
  requestedAt: string;
}

const DoctorConnectionRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected, updateStatus } = useWebSocket({
    userId: user?.id || '',
    userRole: user?.role || 'doctor',
    token: localStorage.getItem('token') || ''
  });

  useEffect(() => {
    fetchConnectionRequests();
    
    // Set user as online when component mounts
    if (user?.id) {
      updateStatus(true);
    }

    // Set user as offline when component unmounts
    return () => {
      if (user?.id) {
        updateStatus(false);
      }
    };
  }, [user?.id]);

  useEffect(() => {
    // Listen for WebSocket notifications
    const handleNotification = (event: CustomEvent) => {
      const notification = event.detail;
      if (notification.type === 'connection_request') {
        fetchConnectionRequests();
      }
    };

    window.addEventListener('websocket-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('websocket-notification', handleNotification as EventListener);
    };
  }, []);

  const fetchConnectionRequests = async () => {
    try {
      setLoading(true);
      const response = await apiService.getConnectionRequests();
      if (response.success) {
        setRequests(response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch connection requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async (patientId: string) => {
    try {
      const response = await apiService.updateConnectionStatus(patientId, 'active');
      if (response.success) {
        fetchConnectionRequests();
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleRejectRequest = async (patientId: string) => {
    try {
      const response = await apiService.updateConnectionStatus(patientId, 'terminated');
      if (response.success) {
        fetchConnectionRequests();
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const formatRequestTime = (requestedAt: string) => {
    const date = new Date(requestedAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-center h-32">
            <LoadingSpinner size="lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="h-5 w-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Connection Requests</h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <div className={`h-2 w-2 rounded-full mr-2 ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            {wsConnected ? 'Live updates' : 'Offline'}
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No pending requests</h3>
            <p className="mt-1 text-sm text-gray-500">
              Patient connection requests will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {request.patientAvatar ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={request.patientAvatar}
                          alt={request.patientName}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {request.patientName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {request.patientName}
                      </h4>
                      <p className="text-sm text-gray-500">{request.patientEmail}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {request.assignmentReason}
                      </p>
                      <div className="flex items-center mt-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatRequestTime(request.requestedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleApproveRequest(request.patientId)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.patientId)}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorConnectionRequests;
