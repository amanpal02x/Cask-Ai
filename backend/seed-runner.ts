import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { ExerciseSeedService } from './src/services/exerciseSeedService';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caskai';

async function runSeed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    await ExerciseSeedService.seedExercises();
    
    console.log('Seed completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

runSeed();
