const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    admission_number: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: function(v) {
          // If admission_number is provided, it must be digits only
          return !v || /^\d+$/.test(v);
        },
        message: 'Admission number must contain only digits'
      }
    },
    registrar_id: {
      type: String,
      trim: true,
      sparse: true,
      validate: {
        validator: function(v) {
          // If registrar_id is provided, it must match the pattern
          return !v || /^(RNS|RSS|RMNS|RMSS)-\d+\/\d+$/.test(v);
        },
        message: 'Registrar ID must match format: RNS-XXX/YYYY, RSS-XXX/YYYY, RMNS-XXX/YYYY, or RMSS-XXX/YYYY'
      }
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'staff', 'student'],
      default: 'student',
    },
    isFirstLogin: {
      type: Boolean,
      default: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
  console.log('Pre-save hook triggered. isNew:', this.isNew, 'isModified(password):', this.isModified('password'));
  // Hash password for new documents or when password is modified
  if (this.isNew || this.isModified('password')) {
    console.log('Hashing password...');
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      this.password = await bcrypt.hash(this.password, salt);
      console.log('Password hashed successfully');
      next();
    } catch (error) {
      console.log('Error hashing password:', error);
      next(error);
    }
  } else {
    console.log('Not hashing password');
    next();
  }
});

userSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate();

  if (!update) return next();

  if (update.password) {
    try {
      const salt = await bcrypt.genSalt(SALT_ROUNDS);
      update.password = await bcrypt.hash(update.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  next();
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
