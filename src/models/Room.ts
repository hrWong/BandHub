import mongoose, { Schema, Document } from 'mongoose';

export interface IRoom extends Document {
    name: string;
    capacity: number;
    equipment: string[];
    isAvailable: boolean;
    imageUrl?: string;
}

const RoomSchema: Schema = new Schema({
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    equipment: { type: [String], default: [] },
    isAvailable: { type: Boolean, default: true },
    imageUrl: { type: String },
}, { timestamps: true });

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);
