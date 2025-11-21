import mongoose from 'mongoose';
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

async function deleteNonAdminUsers() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB\n');

        // Find all non-admin users
        const nonAdminUsers = await User.find({ role: { $ne: 'admin' } });

        if (nonAdminUsers.length === 0) {
            console.log('No non-admin users found.');
        } else {
            console.log(`Found ${nonAdminUsers.length} non-admin user(s):\n`);
            nonAdminUsers.forEach((user, index) => {
                console.log(`${index + 1}. ${user.name} (${user.email})`);
            });

            // Delete all non-admin users
            const result = await User.deleteMany({ role: { $ne: 'admin' } });
            console.log(`\n✅ Deleted ${result.deletedCount} non-admin user(s)`);
        }

        // Show remaining users
        const remainingUsers = await User.find({});
        console.log(`\n📋 Remaining users: ${remainingUsers.length}`);
        remainingUsers.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - ${user.role}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

deleteNonAdminUsers();
