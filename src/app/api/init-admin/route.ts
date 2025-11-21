import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST() {
    await dbConnect();

    try {
        const adminEmail = 'admin@bandhub.com';
        const adminPassword = '1111';
        const adminName = 'Admin User';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (existingAdmin) {
            // Update existing user to admin
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            existingAdmin.password = hashedPassword;
            existingAdmin.role = 'admin';
            existingAdmin.status = 'active';
            existingAdmin.name = adminName;
            await existingAdmin.save();

            return NextResponse.json({
                success: true,
                message: 'Admin user updated successfully',
                user: {
                    name: adminName,
                    email: adminEmail,
                    password: adminPassword,
                    role: 'admin'
                }
            });
        }

        // Create new admin user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: 'admin',
            status: 'active'
        });

        return NextResponse.json({
            success: true,
            message: 'Admin user created successfully',
            user: {
                name: adminName,
                email: adminEmail,
                password: adminPassword,
                role: 'admin'
            }
        });

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
