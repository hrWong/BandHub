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
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdminUser(name: string, email: string, password: string) {
    if (!name || !email || !password) {
        console.error('Please provide name, email, and password.');
        console.log('Usage: npx tsx scripts/create-admin.ts <name> <email> <password>');
        process.exit(1);
    }

    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB\n');

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log(`User with email ${email} already exists.`);
            console.log('Updating to admin with new password...\n');

            const hashedPassword = await bcrypt.hash(password, 10);
            existingUser.password = hashedPassword;
            existingUser.role = 'admin';
            existingUser.status = 'active';
            existingUser.name = name;
            await existingUser.save();

            console.log('✅ User updated successfully!');
        } else {
            // Create new admin user
            const hashedPassword = await bcrypt.hash(password, 10);
            const newUser = await User.create({
                name,
                email,
                password: hashedPassword,
                role: 'admin',
                status: 'active'
            });

            console.log('✅ Admin user created successfully!');
        }

        console.log('\n📋 User Details:');
        console.log(`   Name: ${name}`);
        console.log(`   Email: ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   Role: admin`);
        console.log(`   Status: active`);
        console.log('\n🎉 You can now log in at /login');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

const name = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];
createAdminUser(name, email, password);
