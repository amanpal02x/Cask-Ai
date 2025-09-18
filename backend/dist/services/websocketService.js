"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const socket_io_1 = require("socket.io");
const User_1 = __importDefault(require("../models/User"));
const PatientDoctor_1 = __importDefault(require("../models/PatientDoctor"));
class WebSocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map();
    }
    initialize(server) {
        this.io = new socket_io_1.Server(server, {
            cors: {
                origin: process.env.FRONTEND_URL || "http://localhost:3000",
                methods: ["GET", "POST"]
            }
        });
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            // Handle authentication
            socket.on('authenticate', async (data) => {
                try {
                    // In a real implementation, you would verify the JWT token here
                    // For now, we'll trust the client data
                    const authenticatedSocket = {
                        userId: data.userId,
                        userRole: data.userRole,
                        isAuthenticated: true
                    };
                    this.connectedUsers.set(socket.id, authenticatedSocket);
                    // Update user online status
                    await this.updateUserOnlineStatus(data.userId, true);
                    // Join user to their role-specific room
                    socket.join(data.userRole);
                    socket.join(data.userId);
                    // Notify connected patients/doctors about online status
                    await this.notifyStatusChange(data.userId, data.userRole, true);
                    socket.emit('authenticated', { success: true });
                    console.log(`User ${data.userId} authenticated and online`);
                }
                catch (error) {
                    console.error('Authentication error:', error);
                    socket.emit('authentication_error', { message: 'Authentication failed' });
                }
            });
            // Handle disconnection
            socket.on('disconnect', async () => {
                const user = this.connectedUsers.get(socket.id);
                if (user) {
                    await this.updateUserOnlineStatus(user.userId, false);
                    await this.notifyStatusChange(user.userId, user.userRole, false);
                    this.connectedUsers.delete(socket.id);
                    console.log(`User ${user.userId} disconnected and offline`);
                }
            });
            // Handle manual status updates
            socket.on('update_status', async (data) => {
                const user = this.connectedUsers.get(socket.id);
                if (user) {
                    await this.updateUserOnlineStatus(user.userId, data.isOnline);
                    await this.notifyStatusChange(user.userId, user.userRole, data.isOnline);
                }
            });
            // Handle joining specific patient-doctor relationship room
            socket.on('join_relationship', async (data) => {
                const user = this.connectedUsers.get(socket.id);
                if (user) {
                    socket.join(`relationship_${data.relationshipId}`);
                }
            });
        });
    }
    async updateUserOnlineStatus(userId, isOnline) {
        try {
            await User_1.default.findByIdAndUpdate(userId, {
                isOnline,
                lastSeen: new Date()
            });
        }
        catch (error) {
            console.error('Error updating user online status:', error);
        }
    }
    async notifyStatusChange(userId, userRole, isOnline) {
        try {
            if (userRole === 'doctor') {
                // Notify all patients connected to this doctor
                const relationships = await PatientDoctor_1.default.find({
                    doctorId: userId,
                    status: 'active'
                }).populate('patientId', 'name email');
                relationships.forEach(relationship => {
                    this.io?.to(relationship.patientId._id.toString()).emit('doctor_status_change', {
                        doctorId: userId,
                        doctorName: relationship.patientId.name,
                        isOnline,
                        lastSeen: new Date()
                    });
                });
            }
            else if (userRole === 'patient') {
                // Notify the doctor connected to this patient
                const relationship = await PatientDoctor_1.default.findOne({
                    patientId: userId,
                    status: 'active'
                }).populate('doctorId', 'name email');
                if (relationship) {
                    this.io?.to(relationship.doctorId._id.toString()).emit('patient_status_change', {
                        patientId: userId,
                        patientName: relationship.doctorId.name,
                        isOnline,
                        lastSeen: new Date()
                    });
                }
            }
        }
        catch (error) {
            console.error('Error notifying status change:', error);
        }
    }
    // Method to send real-time notifications
    async sendNotification(recipientId, notification) {
        this.io?.to(recipientId).emit('notification', notification);
    }
    // Method to send message to specific relationship
    async sendRelationshipMessage(relationshipId, message) {
        this.io?.to(`relationship_${relationshipId}`).emit('relationship_message', message);
    }
    // Method to get online users count
    getOnlineUsersCount() {
        return this.connectedUsers.size;
    }
    // Method to get online doctors count
    getOnlineDoctorsCount() {
        return Array.from(this.connectedUsers.values()).filter(user => user.userRole === 'doctor').length;
    }
    // Method to get online patients count
    getOnlinePatientsCount() {
        return Array.from(this.connectedUsers.values()).filter(user => user.userRole === 'patient').length;
    }
}
exports.default = new WebSocketService();
//# sourceMappingURL=websocketService.js.map