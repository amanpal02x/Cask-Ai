"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgressData = exports.getDashboardStats = void 0;
const dashboardService_1 = __importDefault(require("../services/dashboardService"));
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user?.id;
        const userRole = req.user?.role;
        if (!userId || !userRole) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const stats = await dashboardService_1.default.getDashboardStats(userId, userRole);
        const response = {
            success: true,
            data: stats,
            message: 'Dashboard stats retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch dashboard stats'
        };
        res.status(500).json(response);
    }
};
exports.getDashboardStats = getDashboardStats;
const getProgressData = async (req, res) => {
    try {
        const { exerciseId, days } = req.query;
        const userId = req.user?.id;
        if (!userId) {
            const response = {
                success: false,
                data: null,
                message: 'User not authenticated'
            };
            return res.status(401).json(response);
        }
        const progressData = await dashboardService_1.default.getProgressData(userId, exerciseId, parseInt(days) || 30);
        const response = {
            success: true,
            data: progressData,
            message: 'Progress data retrieved successfully'
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching progress data:', error);
        const response = {
            success: false,
            data: null,
            message: 'Failed to fetch progress data'
        };
        res.status(500).json(response);
    }
};
exports.getProgressData = getProgressData;
//# sourceMappingURL=dashboardController.js.map