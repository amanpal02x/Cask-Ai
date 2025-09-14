import { Request, Response } from 'express';
import { ApiResponse } from '../types';
import PatientDoctor from '../models/PatientDoctor';
import User from '../models/User';
import SessionService from '../services/sessionService';
import NotificationService from '../services/notificationService';

export const getPatients = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    const patientRelations = await PatientDoctor.find({
      doctorId: doctorId,
      status: 'active'
    })
    .populate('patientId', 'name email role avatar createdAt')
    .sort({ lastInteraction: -1 });

    const patients = patientRelations.map(relation => ({
      id: relation.patientId._id.toString(),
      name: (relation.patientId as any).name,
      email: (relation.patientId as any).email,
      role: (relation.patientId as any).role,
      avatar: (relation.patientId as any).avatar,
      createdAt: (relation.patientId as any).createdAt.toISOString(),
      lastInteraction: relation.lastInteraction?.toISOString(),
      totalSessions: relation.totalSessions || 0,
      averageScore: relation.averageScore || 0,
      status: relation.status
    }));
    
    const response: ApiResponse<typeof patients> = {
      success: true,
      data: patients,
      message: 'Patients retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching patients:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patients'
    };
    res.status(500).json(response);
  }
};

export const assignPatient = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId, assignmentReason } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!patientId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient ID is required'
      };
      return res.status(400).json(response);
    }

    // Check if patient exists
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== 'patient') {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found'
      };
      return res.status(404).json(response);
    }

    // Check if relationship already exists
    const existingRelation = await PatientDoctor.findOne({
      patientId: patientId,
      doctorId: doctorId
    });

    if (existingRelation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient is already assigned to this doctor'
      };
      return res.status(400).json(response);
    }

    // Create new relationship
    const newRelation = new PatientDoctor({
      patientId: patientId,
      doctorId: doctorId,
      assignedBy: doctorId,
      assignmentReason: assignmentReason,
      status: 'active'
    });

    await newRelation.save();

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: 'Assigned to Doctor',
      message: 'You have been assigned to a doctor for personalized exercise guidance.',
      data: {
        priority: 'medium',
        category: 'assignment'
      }
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient assigned successfully'
    };
    
    res.status(201).json(response);
  } catch (error) {
    console.error('Error assigning patient:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to assign patient'
    };
    res.status(500).json(response);
  }
};

export const getPatientProgress = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    const sessions = await SessionService.getDoctorPatientSessions(doctorId, {
      patientId: patientId,
      limit: 50
    });
    
    const response: ApiResponse<typeof sessions> = {
      success: true,
      data: sessions,
      message: 'Patient progress retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching patient progress:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patient progress'
    };
    res.status(500).json(response);
  }
};

export const sendRecommendation = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    const { message, type = 'recommendation' } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    if (!message) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Message is required'
      };
      return res.status(400).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: type,
      title: 'Doctor Recommendation',
      message: message,
      data: {
        priority: 'high',
        category: 'recommendation',
        metadata: { doctorId, timestamp: new Date().toISOString() }
      }
    });

    // Update last interaction
    relation.lastInteraction = new Date();
    await relation.save();
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Recommendation sent successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error sending recommendation:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to send recommendation'
    };
    res.status(500).json(response);
  }
};

export const updatePatientSettings = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    const { patientSettings, doctorSettings } = req.body;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Verify doctor-patient relationship
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    });

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Update settings
    if (patientSettings) {
      relation.patientSettings = { ...relation.patientSettings, ...patientSettings };
    }
    
    if (doctorSettings) {
      relation.doctorSettings = { ...relation.doctorSettings, ...doctorSettings };
    }

    await relation.save();
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient settings updated successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error updating patient settings:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to update patient settings'
    };
    res.status(500).json(response);
  }
};

export const getPatientDetails = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Get patient relationship with details
    const relation = await PatientDoctor.findOne({
      doctorId: doctorId,
      patientId: patientId,
      status: 'active'
    })
    .populate('patientId', 'name email role avatar createdAt');

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    const patientDetails = {
      id: relation.patientId._id.toString(),
      name: (relation.patientId as any).name,
      email: (relation.patientId as any).email,
      role: (relation.patientId as any).role,
      avatar: (relation.patientId as any).avatar,
      createdAt: (relation.patientId as any).createdAt.toISOString(),
      lastInteraction: relation.lastInteraction?.toISOString(),
      totalSessions: relation.totalSessions || 0,
      averageScore: relation.averageScore || 0,
      status: relation.status,
      patientSettings: relation.patientSettings,
      doctorSettings: relation.doctorSettings,
      assignmentReason: relation.assignmentReason,
      startedAt: relation.startedAt.toISOString()
    };
    
    const response: ApiResponse<typeof patientDetails> = {
      success: true,
      data: patientDetails,
      message: 'Patient details retrieved successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error fetching patient details:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to fetch patient details'
    };
    res.status(500).json(response);
  }
};

export const removePatient = async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).user?.id;
    const { patientId } = req.params;
    
    if (!doctorId) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'User not authenticated'
      };
      return res.status(401).json(response);
    }

    // Find and update relationship
    const relation = await PatientDoctor.findOneAndUpdate(
      {
        doctorId: doctorId,
        patientId: patientId,
        status: 'active'
      },
      {
        status: 'terminated',
        endedAt: new Date()
      },
      { new: true }
    );

    if (!relation) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        message: 'Patient not found or not assigned to you'
      };
      return res.status(404).json(response);
    }

    // Send notification to patient
    await NotificationService.createNotification({
      recipientId: patientId,
      senderId: doctorId,
      type: 'info',
      title: 'Doctor Assignment Ended',
      message: 'Your assignment with your doctor has been terminated.',
      data: {
        priority: 'medium',
        category: 'assignment'
      }
    });
    
    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
      message: 'Patient removed successfully'
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error removing patient:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: 'Failed to remove patient'
    };
    res.status(500).json(response);
  }
};
