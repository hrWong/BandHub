import mongoose, { Schema, Document } from 'mongoose';

export interface IBand extends Document {
    name: string;
    description: string;
    leader: mongoose.Types.ObjectId;
    members: mongoose.Types.ObjectId[];
    pendingMembers: mongoose.Types.ObjectId[];
    status: 'pending' | 'active' | 'rejected';
    createdAt: Date;
    updatedAt: Date;
}

const BandSchema: Schema = new Schema({
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    leader: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    pendingMembers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['pending', 'active', 'rejected'], default: 'pending' },
}, { timestamps: true });

export default mongoose.models.Band || mongoose.model<IBand>('Band', BandSchema);
