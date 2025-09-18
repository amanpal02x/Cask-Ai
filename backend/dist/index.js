"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const http_1 = require("http");
const auth_1 = __importDefault(require("./routes/auth"));
const user_1 = __importDefault(require("./routes/user"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const exercises_1 = __importDefault(require("./routes/exercises"));
const sessions_1 = __importDefault(require("./routes/sessions"));
const exerciseResults_1 = __importDefault(require("./routes/exerciseResults"));
const activities_1 = __importDefault(require("./routes/activities"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const patientDoctor_1 = __importDefault(require("./routes/patientDoctor"));
const websocketService_1 = __importDefault(require("./services/websocketService"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caskai';
mongoose_1.default
    .connect(MONGO_URI)
    .then(() => {
    // eslint-disable-next-line no-console
    console.log('Connected to MongoDB');
})
    .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
app.get('/api/health', (_req, res) => {
    res.json({ success: true, message: 'API is healthy' });
});
app.use('/api/auth', auth_1.default);
app.use('/api/user', user_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/exercises', exercises_1.default);
app.use('/api/sessions', sessions_1.default);
app.use('/api/exercise', exercises_1.default);
app.use('/api/results', exerciseResults_1.default);
app.use('/api/activities', activities_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/doctor', patientDoctor_1.default);
const PORT = Number(process.env.PORT) || 8000;
const server = (0, http_1.createServer)(app);
// Initialize WebSocket service
websocketService_1.default.initialize(server);
server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Server running on port ${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`WebSocket server initialized`);
});
//# sourceMappingURL=index.js.map