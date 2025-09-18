"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const signToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, process.env.JWT_SECRET || 'change_me', { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const { name, email, password, role, specialization, licenseNumber } = req.body;
        if (!name || !email || !password || !role) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }
        const existing = await User_1.default.findOne({ email });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already in use' });
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        const user = await User_1.default.create({ name, email, passwordHash, role, specialization, licenseNumber });
        const token = signToken(user.id, user.role);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User_1.default.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const isValid = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        const token = signToken(user.id, user.role);
        return res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar: user.avatar,
                    createdAt: user.createdAt,
                },
                token,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, error: 'Server error' });
    }
};
exports.login = login;
const logout = async (_req, res) => {
    // Stateless JWT logout handled client-side. Endpoint for symmetry.
    return res.json({ success: true, message: 'Logged out' });
};
exports.logout = logout;
//# sourceMappingURL=authController.js.map