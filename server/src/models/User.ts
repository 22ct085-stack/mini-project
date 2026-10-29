import mongoose, { Schema } from 'mongoose';
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true, sparse: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  passwordHash: { type: String, required: true, select: false },
}, { timestamps: true });
export default mongoose.models.User || mongoose.model('User', UserSchema);
