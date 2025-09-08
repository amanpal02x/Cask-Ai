import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Target, 
  Award,
  BarChart3,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';
import { ChartData, DashboardStats } from '../types';
import apiService from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const ProgressPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [progressData, setProgressData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7' | '30' | '90'>('30');

  useEffect(() => {
    const fetchProgressData = async () => {
      try {
        const [statsResponse, progressResponse] = await Promise.all([
          apiService.getDashboardStats(),
          apiService.getProgressData(undefined, parseInt(timeRange))
        ]);

        if (statsResponse.success) setStats(statsResponse.data!);
        if (progressResponse.success) setProgressData(progressResponse.data!);
      } catch (error) {
        console.error('Failed to fetch progress data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProgressData();
  }, [timeRange]);

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7': return 'Last 7 days';
      case '30': return 'Last 30 days';
      case '90': return 'Last 90 days';
      default: return 'Last 30 days';
    }
  };

  const getAverageScore = () => {
    if (progressData.length === 0) return 0;
    const total = progressData.reduce((sum, data) => sum + data.score, 0);
    return Math.round(total / progressData.length);
  };

  const getTotalReps = () => {
    return progressData.reduce((sum, data) => sum + data.reps, 0);
  };

  const getTotalDuration = () => {
    return progressData.reduce((sum, data) => sum + data.duration, 0);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
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
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Progress Tracking</h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor your exercise performance and improvement over time
              </p>
            </div>
            <div className="flex space-x-2">
              {(['7', '30', '90'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 text-sm font-medium rounded-md ${
                    timeRange === range
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {range}D
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Average Score
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {getAverageScore()}%
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
                <Target className="h-6 w-6 text-blue-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Reps
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {getTotalReps()}
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
                <Clock className="h-6 w-6 text-purple-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Time
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {formatDuration(getTotalDuration())}
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
                <Activity className="h-6 w-6 text-orange-500" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Sessions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {progressData.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Chart */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Performance Trend - {getTimeRangeLabel(timeRange)}
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-primary-500 rounded-full mr-2"></div>
                Score
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                Reps
              </div>
            </div>
          </div>
          
          {progressData.length > 0 ? (
            <div className="h-64 flex items-end justify-between space-x-2">
              {progressData.map((data, index) => {
                const maxScore = Math.max(...progressData.map(d => d.score));
                const maxReps = Math.max(...progressData.map(d => d.reps));
                const scoreHeight = (data.score / maxScore) * 200;
                const repsHeight = (data.reps / maxReps) * 200;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="flex flex-col items-center space-y-1 mb-2">
                      <div 
                        className="w-6 bg-primary-500 rounded-t"
                        style={{ height: `${scoreHeight}px` }}
                        title={`Score: ${data.score}%`}
                      ></div>
                      <div 
                        className="w-6 bg-green-500 rounded-t"
                        style={{ height: `${repsHeight}px` }}
                        title={`Reps: ${data.reps}`}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 transform -rotate-45 origin-left">
                      {new Date(data.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
              <p className="mt-1 text-sm text-gray-500">
                Complete some exercise sessions to see your progress here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Progress Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Sessions</h3>
          
          {progressData.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Errors
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {progressData.slice(0, 10).map((data, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(data.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className={`w-2 h-2 rounded-full mr-2 ${
                              data.score >= 80 ? 'bg-green-500' :
                              data.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          <span className="text-sm text-gray-900">{data.score}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.reps}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDuration(data.duration)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {data.errors}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start exercising to build your progress history.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {stats && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Achievements</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center p-4 bg-yellow-50 rounded-lg">
                <Award className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Consistency</p>
                  <p className="text-xs text-yellow-600">{stats.streakDays} day streak</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-blue-50 rounded-lg">
                <Target className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Total Sessions</p>
                  <p className="text-xs text-blue-600">{stats.totalSessions} completed</p>
                </div>
              </div>
              
              <div className="flex items-center p-4 bg-green-50 rounded-lg">
                <TrendingUp className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm font-medium text-green-800">Average Score</p>
                  <p className="text-xs text-green-600">{stats.averageScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPage;
