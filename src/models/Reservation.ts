import mongoose, { Schema, Document } from 'mongoose';

export interface IReservation extends Document {
    roomId: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;
    bandName: string;
    contactInfo?: string;
    startTime: Date;
    endTime: Date;
    purpose?: string;
    status: 'confirmed' | 'cancelled';
}

const ReservationSchema: Schema = new Schema({
    roomId: { type: Schema.Types.ObjectId, ref: 'Room', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    bandName: { type: String, required: true },
    contactInfo: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    purpose: { type: String },
    status: { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
}, { timestamps: true });

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);
