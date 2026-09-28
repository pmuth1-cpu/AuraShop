import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    sparse: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: false,
  },
  displayName: {
    type: String,
    trim: true,
  },
  telegramId: {
    type: String,
    sparse: true,
    index: true,
  },
  telegramUsername: {
    type: String,
    trim: true,
    lowercase: true,
  },
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
  if (!this.passwordHash || !this.isModified('passwordHash')) return;
  // If already hashed (bcrypt hash starts with $2a$, $2b$, or $2y$), do not hash again
  if (/^\$2[aby]\$\d{2}\$/.test(this.passwordHash)) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export default mongoose.model('User', userSchema);
