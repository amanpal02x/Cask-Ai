import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { createServer } from 'http';
import path from 'path';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import dashboardRoutes from './routes/dashboard';
import exerciseRoutes from './routes/exercises';
import sessionRoutes from './routes/sessions';
import exerciseResultsRoutes from './routes/exerciseResults';
import activityRoutes from './routes/activities';
import notificationRoutes from './routes/notifications';
import patientDoctorRoutes from './routes/patientDoctor';
import chatRoutes from './routes/chat';
import websocketService from './services/websocketService';

dotenv.config();

// Global Error Handlers to prevent crashes from unhandled rejections
process.on('uncaughtException', (err) => {
  
  
});

process.on('unhandledRejection', (reason, promise) => {
  
});

const app = express();

// CORS must be at the top
const allowedOrigins = [
  'http://localhost:3000',
  'https://cask-ai.vercel.app',
  process.env.CLIENT_ORIGIN
].filter(Boolean) as string[];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.includes(origin) || 
                       origin.endsWith('.vercel.app') || 
                       origin.includes('localhost');
                       
      if (isAllowed) {
        callback(null, true);
      } else {
        // Log unauthorized origin but allow during debugging if needed
        
        callback(null, true); 
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Set-Cookie']
  })
);

app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(morgan('dev'));

// Request logging middleware for debugging
app.use((req, res, next) => {
  
  next();
});

app.options('*', cors()); // Enable pre-flight for all routes

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caskai';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    // eslint-disable-next-line no-console
    
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    
    process.exit(1);
  });

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'API is healthy' });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/results', exerciseResultsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/doctor', patientDoctorRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  
  
  // Ensure CORS headers are present even in error responses
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

const PORT = Number(process.env.PORT) || 8000;
const server = createServer(app);

// Initialize WebSocket service
websocketService.initialize(server);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    
    // eslint-disable-next-line no-console
    
  });
}

export default app;
