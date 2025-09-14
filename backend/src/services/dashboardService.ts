import { Types } from 'mongoose';
import ExerciseSession from '../models/ExerciseSession';
import Progress from '../models/Progress';
import PatientDoctor from '../models/PatientDoctor';
import Activity from '../models/Activity';
import { DashboardStats, ChartData } from '../types';

export class DashboardService {
  
  // Get comprehensive dashboard statistics for a user
  static async getDashboardStats(userId: string, userRole: 'patient' | 'doctor'): Promise<DashboardStats> {
    const userObjectId = new Types.ObjectId(userId);
    
    if (userRole === 'patient') {
      return this.getPatientDashboardStats(userObjectId);
    } else {
      return this.getDoctorDashboardStats(userObjectId);
    }
  }

  // Patient dashboard statistics
  private static async getPatientDashboardStats(userId: Types.ObjectId): Promise<DashboardStats> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalSessions,
      recentSessions,
      weeklyProgress,
      currentStreak
    ] = await Promise.all([
      // Total sessions count
      ExerciseSession.countDocuments({ 
        patientId: userId, 
        status: 'completed' 
      }),
      
      // Recent sessions for average score
      ExerciseSession.aggregate([
        {
          $match: {
            patientId: userId,
            status: 'completed',
            startTime: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: null,
            averageScore: { $avg: '$averageScore' },
            totalExercises: { $sum: 1 },
            totalReps: { $sum: '$totalReps' }
          }
        }
      ]),
      
      // Weekly progress
      Progress.findOne({
        patientId: userId,
        period: 'weekly',
        periodStart: { $lte: new Date() },
        periodEnd: { $gte: new Date() }
      }),
      
      // Current streak calculation
      this.calculateCurrentStreak(userId)
    ]);

    const recentStats = recentSessions[0] || { averageScore: 0, totalExercises: 0, totalReps: 0 };

    return {
      totalSessions: totalSessions || 0,
      averageScore: Math.round(recentStats.averageScore || 0),
      totalExercises: recentStats.totalExercises || 0,
      streakDays: currentStreak,
      weeklyProgress: weeklyProgress?.totalSessions || 0,
      improvementRate: await this.calculateImprovementRate(userId)
    };
  }

  // Doctor dashboard statistics
  private static async getDoctorDashboardStats(doctorId: Types.ObjectId): Promise<DashboardStats> {
    const [
      patientStats,
      recentActivity,
      weeklyStats
    ] = await Promise.all([
      // Patient statistics
      PatientDoctor.aggregate([
        { $match: { doctorId, status: 'active' } },
        {
          $group: {
            _id: null,
            totalPatients: { $sum: 1 },
            activePatients: { $sum: { $cond: [{ $ne: ['$lastInteraction', null] }, 1, 0] } }
          }
        }
      ]),
      
      // Recent activity count
      Activity.countDocuments({
        relatedUserId: doctorId,
        type: { $in: ['exercise_completed', 'exercise_started', 'progress_update'] },
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }),
      
      // Weekly session statistics
      ExerciseSession.aggregate([
        {
          $match: {
            doctorId,
            status: 'completed',
            startTime: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
          }
        },
        {
          $group: {
            _id: null,
            totalSessions: { $sum: 1 },
            averageScore: { $avg: '$averageScore' },
            totalReps: { $sum: '$totalReps' }
          }
        }
      ])
    ]);

    const patientData = patientStats[0] || { totalPatients: 0, activePatients: 0 };
    const weeklyData = weeklyStats[0] || { totalSessions: 0, averageScore: 0, totalReps: 0 };

    return {
      totalSessions: weeklyData.totalSessions,
      averageScore: Math.round(weeklyData.averageScore || 0),
      totalExercises: weeklyData.totalSessions, // Sessions count as exercises for doctors
      streakDays: patientData.activePatients, // Active patients as "streak"
      weeklyProgress: recentActivity,
      improvementRate: await this.calculateDoctorImprovementRate(doctorId)
    };
  }

  // Get progress chart data for a user
  static async getProgressData(
    userId: string, 
    exerciseId?: string, 
    days: number = 30
  ): Promise<ChartData[]> {
    const userObjectId = new Types.ObjectId(userId);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const matchQuery: any = {
      patientId: userObjectId,
      status: 'completed',
      startTime: { $gte: startDate }
    };

    if (exerciseId) {
      matchQuery.exerciseId = new Types.ObjectId(exerciseId);
    }

    const sessions = await ExerciseSession.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$startTime' } },
            exerciseId: '$exerciseId'
          },
          score: { $avg: '$averageScore' },
          reps: { $sum: '$totalReps' },
          duration: { $sum: '$duration' },
          sessionCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: '$_id.date',
          score: { $avg: '$score' },
          reps: { $sum: '$reps' },
          duration: { $sum: '$duration' },
          sessionCount: { $sum: '$sessionCount' }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return sessions.map(session => ({
      date: session._id,
      score: Math.round(session.score || 0),
      reps: session.reps || 0,
      duration: Math.round((session.duration || 0) / 60), // Convert to minutes
      sessionCount: session.sessionCount || 0
    }));
  }

  // Calculate current streak for a patient
  private static async calculateCurrentStreak(userId: Types.ObjectId): Promise<number> {
    const sessions = await ExerciseSession.find({
      patientId: userId,
      status: 'completed'
    })
    .sort({ startTime: -1 })
    .limit(30); // Check last 30 days

    if (sessions.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Group sessions by date
    const sessionsByDate = new Map();
    sessions.forEach(session => {
      const date = new Date(session.startTime);
      date.setHours(0, 0, 0, 0);
      sessionsByDate.set(date.getTime(), true);
    });

    // Count consecutive days
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);

      if (sessionsByDate.has(checkDate.getTime())) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }

  // Calculate improvement rate for a patient
  private static async calculateImprovementRate(userId: Types.ObjectId): Promise<number> {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [recentSessions, olderSessions] = await Promise.all([
      ExerciseSession.aggregate([
        {
          $match: {
            patientId: userId,
            status: 'completed',
            startTime: { $gte: twoWeeksAgo }
          }
        },
        { $group: { _id: null, averageScore: { $avg: '$averageScore' } } }
      ]),
      ExerciseSession.aggregate([
        {
          $match: {
            patientId: userId,
            status: 'completed',
            startTime: { $lt: twoWeeksAgo },
            startTime: { $gte: new Date(twoWeeksAgo.getTime() - 14 * 24 * 60 * 60 * 1000) }
          }
        },
        { $group: { _id: null, averageScore: { $avg: '$averageScore' } } }
      ])
    ]);

    const recentAvg = recentSessions[0]?.averageScore || 0;
    const olderAvg = olderSessions[0]?.averageScore || 0;

    if (olderAvg === 0) return 0;
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  }

  // Calculate improvement rate for a doctor's patients
  private static async calculateDoctorImprovementRate(doctorId: Types.ObjectId): Promise<number> {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [recentSessions, olderSessions] = await Promise.all([
      ExerciseSession.aggregate([
        {
          $match: {
            doctorId,
            status: 'completed',
            startTime: { $gte: twoWeeksAgo }
          }
        },
        { $group: { _id: null, averageScore: { $avg: '$averageScore' } } }
      ]),
      ExerciseSession.aggregate([
        {
          $match: {
            doctorId,
            status: 'completed',
            startTime: { $lt: twoWeeksAgo },
            startTime: { $gte: new Date(twoWeeksAgo.getTime() - 14 * 24 * 60 * 60 * 1000) }
          }
        },
        { $group: { _id: null, averageScore: { $avg: '$averageScore' } } }
      ])
    ]);

    const recentAvg = recentSessions[0]?.averageScore || 0;
    const olderAvg = olderSessions[0]?.averageScore || 0;

    if (olderAvg === 0) return 0;
    return Math.round(((recentAvg - olderAvg) / olderAvg) * 100);
  }
}

export default DashboardService;
