import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  CheckCircle,
  Clock,
  MessageSquare,
  Wifi,
  WifiOff,
  Circle,
  AlertCircle,
  X,
  LogOut
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';
import { useWebSocket } from '../hooks/useWebSocket';
import { useAuth } from '../hooks/useAuth';

interface DoctorConnectionStatus {
  isConnected: boolean;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
    isOnline: boolean;
    lastSeen: string | null;
  } | null;
  status: string | null;
  connectionDate: string | null;
}

interface SidebarDoctorConnectionProps {
  userId: string;
}

const SidebarDoctorConnection: React.FC<SidebarDoctorConnectionProps> = ({ userId }) => {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<DoctorConnectionStatus | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [onlineDoctors, setOnlineDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected: wsConnected, onlineUsers, updateStatus } = useWebSocket({
    userId: user?.id || '',
    userRole: user?.role || 'patient',
    token: localStorage.getItem('authToken') || ''
  });

  useEffect(() => {
    fetchConnectionStatus();
    
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
      if (notification.type === 'connection_update') {
        fetchConnectionStatus();
      }
    };

    window.addEventListener('websocket-notification', handleNotification as EventListener);
    return () => {
      window.removeEventListener('websocket-notification', handleNotification as EventListener);
    };
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatientConnectionStatus();
      if (response.success) {
        setConnectionStatus(response.data!);
        
        // Fetch online doctors if not connected
        if (!response.data!.isConnected) {
          const [doctorsResponse, onlineDoctorsResponse] = await Promise.all([
            apiService.getDoctors(),
            apiService.getOnlineDoctors()
          ]);
          
          if (doctorsResponse.success) {
            setDoctors(doctorsResponse.data || []);
          }
          if (onlineDoctorsResponse.success) {
            setOnlineDoctors(onlineDoctorsResponse.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch connection status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnectDoctor = async (doctorId: string) => {
    try {
      const response = await apiService.requestDoctorConnection(doctorId, 'Patient requested connection for exercise guidance');
      if (response.success) {
        fetchConnectionStatus();
        setShowConnectModal(false);
        setShowOnlineModal(false);
      }
    } catch (error) {
      console.error('Failed to connect to doctor:', error);
    }
  };

  const handleDisconnectDoctor = async () => {
    try {
      console.log('[SidebarDoctorConnection] Disconnect request starting');
      setDisconnecting(true);
      // Optimistic UI: mark as disconnected immediately
      setConnectionStatus((prev) =>
        prev
          ? {
              ...prev,
              isConnected: false,
              status: 'terminated',
              connectionDate: prev.connectionDate,
              doctor: prev.doctor,
            }
          : prev
      );

      // Notify other app instances (e.g., mobile/desktop sidebars) to refresh
      try {
        window.dispatchEvent(
          new CustomEvent('websocket-notification', {
            detail: { type: 'connection_update' }
          })
        );
      } catch {}

      const response = await apiService.disconnectFromDoctor();
      if (response.success) {
        console.log('[SidebarDoctorConnection] Disconnect successful');
        // Mark offline after disconnect
        try {
          await apiService.updateOnlineStatus(false);
          updateStatus(false);
        } catch (e) {
          console.error('Failed to update online status after disconnect:', e);
        }
        // Refresh from server to reflect final state
        fetchConnectionStatus();
        try {
          window.dispatchEvent(
            new CustomEvent('websocket-notification', {
              detail: { type: 'connection_update' }
            })
          );
        } catch {}
        setShowDisconnectModal(false);
      }
    } catch (error) {
      console.error('Failed to disconnect from doctor:', error);
    } finally {
      setDisconnecting(false);
    }
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'text-green-600' : 'text-gray-400';
  };

  const getStatusIcon = (isOnline: boolean) => {
    return isOnline ? (
      <Wifi className="h-3 w-3" />
    ) : (
      <WifiOff className="h-3 w-3" />
    );
  };

  const formatLastSeen = (lastSeen: string | null) => {
    if (!lastSeen) return 'Never';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center justify-center">
          <LoadingSpinner size="sm" />
        </div>
      </div>
    );
  }

  // Show connected doctor status
  if (!disconnecting && connectionStatus?.isConnected && connectionStatus.doctor && connectionStatus.status !== 'terminated') {
    const doctor = connectionStatus.doctor;
    const isOnline = doctor.isOnline || onlineUsers[doctor.id] || false;
    
    return (
      <div className="px-3 py-2">
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              <h4 className="text-sm font-medium text-green-900">Connected to Doctor</h4>
            </div>
            <div className={`flex items-center ${getStatusColor(isOnline)}`}>
              {getStatusIcon(isOnline)}
              <span className="ml-1 text-xs">
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="bg-white rounded p-2 border">
            <h5 className="text-sm font-medium text-gray-900">{doctor.name}</h5>
            <p className="text-xs text-gray-500">{doctor.specialization || 'General Practice'}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">
                {connectionStatus.status === 'pending' ? 'Pending approval' : 'Active connection'}
              </span>
              {!isOnline && (
                <span className="text-xs text-gray-400">
                  Last seen: {formatLastSeen(doctor.lastSeen)}
                </span>
              )}
            </div>
          </div>

          {connectionStatus.status === 'pending' && (
            <div className="mt-2 flex items-center text-xs text-yellow-700 bg-yellow-100 rounded p-2">
              <AlertCircle className="h-3 w-3 mr-1" />
              Waiting for doctor approval
            </div>
          )}

          {connectionStatus.status === 'active' && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  console.log('[SidebarDoctorConnection] Open disconnect modal');
                  // Direct confirm + disconnect to ensure network call fires
                  const confirmed = window.confirm('Are you sure you want to disconnect from your doctor?');
                  if (confirmed) {
                    handleDisconnectDoctor();
                  } else {
                    setShowDisconnectModal(false);
                  }
                }}
                className="flex items-center text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
              >
                <LogOut className="h-3 w-3 mr-1" />
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show connection options
  return (
    <div className="px-3 py-2">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <h4 className="text-sm font-medium text-blue-900">Connect with Doctor</h4>
          </div>
          <div className="flex items-center text-xs text-gray-500">
            <Circle className={`h-2 w-2 mr-1 ${wsConnected ? 'text-green-500' : 'text-red-500'}`} />
            {wsConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        
        <p className="text-xs text-blue-700 mb-3">
          Get personalized exercise guidance from healthcare professionals.
        </p>

        <div className="space-y-2">
          {onlineDoctors.length > 0 && (
            <div className="bg-white rounded p-2 border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Wifi className="h-3 w-3 text-green-600 mr-1" />
                  <span className="text-xs font-medium text-green-800">
                    {onlineDoctors.length} doctor{onlineDoctors.length > 1 ? 's' : ''} online
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowOnlineModal(true)}
                    className="text-xs text-green-600 hover:text-green-800 font-medium"
                  >
                    View online
                  </button>
                  <button
                    onClick={() => setShowConnectModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Doctor list
                  </button>
                </div>
              </div>
            </div>
          )}

          {doctors.length > 0 && (
            <div className="space-y-1">
              {doctors.slice(0, 2).map((doctor) => {
                const isOnline = onlineDoctors.some(online => online.id === doctor.id);
                return (
                  <div key={doctor.id} className="flex items-center justify-between bg-white rounded p-2 border">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-xs font-medium text-gray-900 truncate">
                          {doctor.name}
                        </p>
                        {isOnline && (
                          <div className="ml-1 flex items-center text-green-600">
                            <Wifi className="h-2 w-2" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {doctor.specialization || 'General Practice'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConnectDoctor(doctor.id)}
                      className="ml-2 inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <UserPlus className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
              
              {/* Always offer full doctor list entry point below */}
              <button
                onClick={() => setShowConnectModal(true)}
                className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Doctor list ({doctors.length})
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline panel for showing all doctors */}
      {showConnectModal && (
        <div className="mt-3 border rounded-lg bg-white">
          <div className="px-4 py-3 border-b flex items-center">
            <Users className="h-4 w-4 text-blue-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">All Doctors</h3>
            <button onClick={() => setShowConnectModal(false)} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Hide</button>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {doctors.map((doctor) => {
                  const isOnline = onlineDoctors.some(online => online.id === doctor.id);
                  return (
                    <tr key={doctor.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 text-sm text-gray-900 font-medium truncate">{doctor.name}</td>
                      <td className="px-4 py-2 text-right">
                        <div className="inline-flex flex-col items-end">
                          <button
                            onClick={() => handleConnectDoctor(doctor.id)}
                            className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                          >
                            <UserPlus className="h-3 w-3 mr-1" />
                            Connect
                          </button>
                          <span className="mt-0.5 text-[10px] text-gray-400">Last seen: {formatLastSeen(doctor.lastSeen)}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inline panel for showing online doctors (online only) */}
      {showOnlineModal && (
        <div className="mt-3 border rounded-lg bg-white">
          <div className="px-4 py-3 border-b flex items-center">
            <Wifi className="h-4 w-4 text-green-600 mr-2" />
            <h3 className="text-sm font-medium text-gray-900">Online Doctors</h3>
            <button onClick={() => setShowOnlineModal(false)} className="ml-auto text-xs text-gray-500 hover:text-gray-700">Hide</button>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {onlineDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 font-medium truncate">{doctor.name}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex flex-col items-end">
                        <button
                          onClick={() => handleConnectDoctor(doctor.id)}
                          className="inline-flex items-center px-2.5 py-1 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Connect
                        </button>
                        <span className="mt-0.5 text-[10px] text-gray-400">Last seen: {formatLastSeen(doctor.lastSeen)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Disconnect from Doctor</h3>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to disconnect from Dr. {connectionStatus?.doctor?.name}? 
                This action will end your current connection and you'll need to request a new connection to communicate with them again.
              </p>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Important:</p>
                    <p>You will lose access to your doctor's guidance and recommendations until you reconnect.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  console.log('[SidebarDoctorConnection] Cancel disconnect clicked');
                  setShowDisconnectModal(false);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={disconnecting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log('[SidebarDoctorConnection] Modal disconnect clicked');
                  handleDisconnectDoctor();
                }}
                disabled={disconnecting}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {disconnecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Disconnecting...
                  </div>
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarDoctorConnection;