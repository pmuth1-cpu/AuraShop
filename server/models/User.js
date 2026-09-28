import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
  },
  displayName: {
    type: String,
    trim: true,
  },
  phone: String,
  role: {
    type: String,
    enum: ['seller', 'admin'],
    default: 'seller',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Hash password before saving if it is not already a bcrypt hash
userSchema.pre('save', async function() {
  if (!this.isModified('passwordHash')) return;
  // If already hashed (bcrypt hash starts with $2a$, $2b$, or $2y$), do not hash again
  if (/^\$2[aby]\$\d{2}\$/.test(this.passwordHash)) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
