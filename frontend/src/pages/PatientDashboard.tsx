import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Play, 
  Upload, 
  BarChart3, 
  Bell, 
  Activity,
  TrendingUp,
  Clock,
  Target,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Exercise, DashboardStats, ExerciseSession } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [recentSessions, setRecentSessions] = useState<ExerciseSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, exercisesResponse, sessionsResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getExercises(),
          apiService.getSessionHistory(5)
        ]);

        if (statsResponse.success) setStats(statsResponse.data!);
        if (exercisesResponse.success) setExercises(exercisesResponse.data || []);
        if (sessionsResponse.success) setRecentSessions(sessionsResponse.data!);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
            Welcome back, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Ready to start your exercise session? Let's track your progress together.
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/patient/exercise/new"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-primary-50 text-primary-700 ring-4 ring-white">
              <Play className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Start Live Exercise
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Begin a new exercise session with real-time feedback and guidance.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <Activity className="h-6 w-6" />
          </span>
        </Link>

        <div className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer">
          <div>
            <span className="rounded-lg inline-flex p-3 bg-secondary-50 text-secondary-700 ring-4 ring-white">
              <Upload className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              Upload Past Session
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Upload a recorded exercise video for analysis and feedback.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <Upload className="h-6 w-6" />
          </span>
        </div>

        <Link
          to="/patient/progress"
          className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary-500 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div>
            <span className="rounded-lg inline-flex p-3 bg-yellow-50 text-yellow-700 ring-4 ring-white">
              <BarChart3 className="h-6 w-6" />
            </span>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-medium">
              <span className="absolute inset-0" aria-hidden="true" />
              View Progress
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Track your improvement with detailed charts and analytics.
            </p>
          </div>
          <span
            className="pointer-events-none absolute top-6 right-6 text-gray-300 group-hover:text-gray-400"
            aria-hidden="true"
          >
            <TrendingUp className="h-6 w-6" />
          </span>
        </Link>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Activity className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Sessions
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalSessions}
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
                      Average Score
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.averageScore}%
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
                      Exercises Completed
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalExercises}
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
                  <Clock className="h-6 w-6 text-gray-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Streak Days
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.streakDays}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Exercise Sessions
          </h3>
          <div className="mt-5">
            {recentSessions.length > 0 ? (
              <div className="flow-root">
                <ul className="-my-5 divide-y divide-gray-200">
                  {recentSessions.map((session) => (
                    <li key={session.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-primary-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Exercise Session
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(session.startTime).toLocaleDateString()} at{' '}
                            {new Date(session.startTime).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            session.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : session.status === 'active'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {session.status}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-6">
                <Activity className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Start your first exercise session to see your progress here.
                </p>
                <div className="mt-6">
                  <Link
                    to="/patient/exercise/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Exercise
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <Bell className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Notifications & Messages
            </h3>
          </div>
          <div className="mt-5">
            <div className="text-center py-6">
              <Bell className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No new notifications</h3>
              <p className="mt-1 text-sm text-gray-500">
                You'll receive updates from your doctor and system notifications here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
