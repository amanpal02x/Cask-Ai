import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  BarChart3, 
  Bell, 
  Activity,
  TrendingUp,
  Target,
  CheckCircle,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Patient, DashboardStats } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import DoctorConnectionRequests from '../components/DoctorConnectionRequests';
import { useWebSocket } from '../hooks/useWebSocket';

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState<boolean>(false);

  const { updateStatus } = useWebSocket({
    userId: user?.id || '',
    userRole: 'doctor',
    token: localStorage.getItem('authToken') || ''
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, patientsResponse, activityResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getPatients(),
          apiService.getRecentActivity(10)
        ]);

        if (statsResponse.success) setStats(statsResponse.data!);
        if (patientsResponse.success) setPatients(patientsResponse.data!);
        if (activityResponse.success) setRecentActivity(activityResponse.data!);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();

    // Ensure doctors remain online across refresh while on the dashboard
    const setActive = async () => {
      try {
        setIsOnline(true);
        await apiService.updateOnlineStatus(true);
        updateStatus(true);
      } catch (e) {
        console.error('Failed to set doctor online on mount', e);
      }
    };
    setActive();

    return () => {
      // Mark offline when leaving the dashboard
      (async () => {
        try {
          setIsOnline(false);
          await apiService.updateOnlineStatus(false);
          updateStatus(false);
        } catch {}
      })();
    };
  }, []);

  const toggleOnline = async () => {
    try {
      const next = !isOnline;
      setIsOnline(next);
      await apiService.updateOnlineStatus(next);
      updateStatus(next);
    } catch (e) {
      console.error('Failed to update online status', e);
      setIsOnline((prev) => !prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, Dr. {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor your patients' progress and provide personalized guidance.
          </p>
          <div className="mt-4 flex flex-col items-start">
            <button
              onClick={toggleOnline}
              title={isOnline ? 'Online - click to go offline' : 'Offline - click to go online'}
              aria-label={isOnline ? 'Online' : 'Offline'}
              className={`h-4 w-4 rounded-full border transition-colors duration-150 ${
                isOnline
                  ? 'bg-green-500 border-green-600 hover:bg-green-600'
                  : 'bg-red-500 border-red-600 hover:bg-red-600'
              }`}
            />
            <span className={`mt-1 text-xs ${isOnline ? 'text-green-700' : 'text-gray-600'}`}>
              {isOnline ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/doctor/patients"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
              <Users className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Patient Profiles
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              View and manage your patients' profiles and exercise plans.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <UserPlus className="h-6 w-6" />
          </span>
        </Link>

        <Link
          to="/doctor/reports"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-secondary-50 text-secondary-700 ring-4 ring-white">
              <FileText className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Exercise Reports
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Review detailed reports on patient performance and posture errors.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <BarChart3 className="h-6 w-6" />
          </span>
        </Link>

        <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
          <div>
            <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
              <BarChart3 className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Progress Charts
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Analyze patient progress with comprehensive charts and analytics.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <TrendingUp className="h-6 w-6" />
          </span>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Patients
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {patients.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Activity className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalSessions || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg. Patient Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.averageScore || 0}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed Exercises
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats?.totalExercises || 0}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Requests */}
      <DoctorConnectionRequests />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Patient Activity */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Patient Activity
            </h3>
            <div className="mt-5">
              {recentActivity.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {recentActivity.map((activity) => (
                      <li key={activity.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                              <Activity className="h-4 w-4 text-primary-600" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {activity.user?.name || 'Patient'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {activity.title}
                            </p>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            {activity.session?.score && (
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                activity.session.score >= 80 
                                  ? 'bg-green-100 text-green-800'
                                  : activity.session.score >= 60
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {activity.session.score}%
                              </span>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Activity className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Patient activity will appear here as they complete exercises.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Patient List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Your Patients
              </h3>
              <Link
                to="/doctor/patients"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
            <div className="mt-5">
              {patients.length > 0 ? (
                <div className="flow-root">
                  <ul className="-my-5 divide-y divide-gray-200">
                    {patients.slice(0, 5).map((patient) => (
                      <li key={patient.id} className="py-4">
                        <div className="flex items-center space-x-4">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {patient.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {patient.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {patient.email}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              patient.status === 'active' 
                                ? 'bg-green-100 text-green-800'
                                : patient.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {patient.status || 'Active'}
                            </span>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No patients yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Patients will appear here once they register and connect with you.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Alerts & Notifications
            </h3>
          </div>
          <div className="mt-5">
            <div className="space-y-3">
              {patients.filter(p => p.averageScore && p.averageScore < 60).slice(0, 2).map((patient) => (
                <div key={patient.id} className="flex items-center p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800">
                      {patient.name} needs attention
                    </p>
                    <p className="text-xs text-yellow-600">
                      Low exercise scores (avg: {patient.averageScore}%)
                    </p>
                  </div>
                </div>
              ))}
              
              {patients.filter(p => p.averageScore && p.averageScore > 85).slice(0, 1).map((patient) => (
                <div key={patient.id} className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      {patient.name} is doing great!
                    </p>
                    <p className="text-xs text-blue-600">
                      Excellent progress (avg: {patient.averageScore}%)
                    </p>
                  </div>
                </div>
              ))}
              
              {patients.filter(p => !p.averageScore || (p.averageScore >= 60 && p.averageScore <= 85)).length === 0 && 
               patients.filter(p => p.averageScore && p.averageScore < 60).length === 0 &&
               patients.filter(p => p.averageScore && p.averageScore > 85).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">No alerts at this time</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default DoctorDashboard;
