// Run this script to migrate existing reservations to have type and participantCount fields
// Usage: MONGODB_URI="your_mongodb_uri" node scripts/migrate-reservations.js

const mongoose = require('mongoose');

async function migrateReservations() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/bandhub';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const reservations = db.collection('reservations');

        // Update all reservations that don't have a type field
        const result = await reservations.updateMany(
            { type: { $exists: false } },
            {
                $set: {
                    type: 'exclusive',
                    participantCount: 1
                }
            }
        );

        console.log(`Migration complete!`);
        console.log(`Updated ${result.modifiedCount} reservations`);
        console.log(`Matched ${result.matchedCount} reservations without type field`);

        await mongoose.connection.close();
        console.log('Connection closed');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateReservations();
