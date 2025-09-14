import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './routes/auth';
import userRoutes from './routes/user';
import dashboardRoutes from './routes/dashboard';
import exerciseRoutes from './routes/exercises';
import sessionRoutes from './routes/sessions';
import exerciseResultsRoutes from './routes/exerciseResults';
import activityRoutes from './routes/activities';
import notificationRoutes from './routes/notifications';
import patientDoctorRoutes from './routes/patientDoctor';

dotenv.config();

const app = express();

app.use(express.json());
app.use(morgan('dev'));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caskai';

mongoose
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

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/results', exerciseResultsRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/doctor', patientDoctorRoutes);

const PORT = Number(process.env.PORT) || 8000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on port ${PORT}`);
});


