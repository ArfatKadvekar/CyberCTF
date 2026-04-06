import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { User, Event, Challenge, Submission } from './models/index.js';

dotenv.config();

const cleanDatabase = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri || uri.includes('localhost') || uri.includes('username:password')) {
      console.error('❌ Error: Please set a valid MONGODB_URI in your .env file to run this script on the production database!');
      process.exit(1);
    }
    
    console.log('Connecting to database...');
    await mongoose.connect(uri);
    console.log('✅ Connected.');

    // 1. Wipe all collections
    console.log('Cleaning database collections...');
    await User.deleteMany({});
    await Event.deleteMany({});
    await Challenge.deleteMany({});
    await Submission.deleteMany({});
    console.log('✅ Database cleaned.');

    // 2. Create the default admin
    console.log('Creating default admin...');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash('n0thinghere#', saltRounds);

    const admin = await User.create({
      username: 'ctfadmin',
      email: 'admin@ctf.local',
      password: 'n0thinghere#', // We rely on the pre-save hook in the User model to hash if it's there
      role: 'admin',
    });

    console.log(`✅ Admin account created:`);
    console.log(`Username: ${admin.username}`);
    console.log(`Password: n0thinghere#`);

    console.log('🎉 Setup complete! You can safely close this script.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clean the database:', error);
    process.exit(1);
  }
};

cleanDatabase();
