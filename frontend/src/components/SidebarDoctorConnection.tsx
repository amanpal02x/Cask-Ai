import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Users, 
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react';
import apiService from '../services/api';
import LoadingSpinner from './LoadingSpinner';

interface DoctorConnectionStatus {
  isConnected: boolean;
  doctor: {
    id: string;
    name: string;
    email: string;
    specialization?: string;
  } | null;
  status: string | null;
  connectionDate: string | null;
}

interface SidebarDoctorConnectionProps {
  userId: string;
}

const SidebarDoctorConnection: React.FC<SidebarDoctorConnectionProps> = ({ userId }) => {
  const [connectionStatus, setConnectionStatus] = useState<DoctorConnectionStatus | null>(null);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    fetchConnectionStatus();
  }, []);

  const fetchConnectionStatus = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPatientConnectionStatus();
      if (response.success) {
        setConnectionStatus(response.data!);
        
        // Only fetch doctors if not connected
        if (!response.data!.isConnected) {
          const doctorsResponse = await apiService.getDoctors();
          if (doctorsResponse.success) {
            setDoctors(doctorsResponse.data || []);
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
      }
    } catch (error) {
      console.error('Failed to connect to doctor:', error);
    }
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

  // Don't show anything if already connected
  if (connectionStatus?.isConnected) {
    return null;
  }

  return (
    <div className="px-3 py-2">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center mb-2">
          <Users className="h-4 w-4 text-blue-600 mr-2" />
          <h4 className="text-sm font-medium text-blue-900">Connect with Doctor</h4>
        </div>
        
        <p className="text-xs text-blue-700 mb-3">
          Get personalized exercise guidance from a healthcare professional.
        </p>

        {doctors.length > 0 ? (
          <div className="space-y-2">
            {doctors.slice(0, 2).map((doctor) => (
              <div key={doctor.id} className="flex items-center justify-between bg-white rounded p-2 border">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">
                    {doctor.name}
                  </p>
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
            ))}
            
            {doctors.length > 2 && (
              <button
                onClick={() => setShowConnectModal(true)}
                className="w-full text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                View all {doctors.length} doctors
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-2">
            <p className="text-xs text-blue-600">No doctors available</p>
          </div>
        )}
      </div>

      {/* Modal for showing all doctors */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowConnectModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center mb-4">
                  <Users className="h-5 w-5 text-blue-600 mr-2" />
                  <h3 className="text-lg font-medium text-gray-900">Available Doctors</h3>
                </div>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {doctors.map((doctor) => (
                    <div key={doctor.id} className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900">{doctor.name}</h4>
                        <p className="text-sm text-gray-500">{doctor.email}</p>
                        <p className="text-xs text-gray-500">
                          {doctor.specialization || 'General Practice'}
                        </p>
                      </div>
                      <button
                        onClick={() => handleConnectDoctor(doctor.id)}
                        className="ml-3 inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                      >
                        <UserPlus className="h-3 w-3 mr-1" />
                        Connect
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={() => setShowConnectModal(false)}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SidebarDoctorConnection;
