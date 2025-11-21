import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('Please define the MONGODB_URI environment variable inside .env.local');
    process.exit(1);
}

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function resetPassword(email: string, newPassword: string) {
    if (!email || !newPassword) {
        console.error('Please provide both email and new password.');
        console.log('Usage: npx tsx scripts/reset-password.ts <email> <new-password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            console.error(`User with email ${email} not found.`);
            process.exit(1);
        }

        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        console.log(`✅ Password reset successfully for ${user.name} (${user.email})`);
        console.log(`New password: ${newPassword}`);
        console.log('You can now log in with this password.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

const email = process.argv[2];
const newPassword = process.argv[3];
resetPassword(email, newPassword);
