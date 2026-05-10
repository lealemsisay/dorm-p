const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  id: String,
  admission_number: String,
  registrar_id: String,
  password: String,
  role: String,
  isFirstLogin: Boolean,
  isActive: Boolean
});

const User = mongoose.model('User', userSchema);

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/dormitoryDB');
    console.log('Connected to MongoDB');

    // Delete existing test users first
    await User.deleteMany({ id: { $in: ['RNS-123/2023', '123456789'] } });
    console.log('Deleted existing test users');

    // Create test registrar ID user
    const hashedPassword1 = await bcrypt.hash('test123', 10);
    const registrarUser = new User({
      id: 'RNS-123/2023',
      registrar_id: 'RNS-123/2023',
      password: hashedPassword1,
      role: 'admin',
      isFirstLogin: false,
      isActive: true
    });

    await registrarUser.save();
    console.log('Registrar ID test user created: RNS-123/2023');

    // Create test admission number user
    const hashedPassword2 = await bcrypt.hash('test123', 10);
    const admissionUser = new User({
      id: '123456789',
      admission_number: '123456789',
      password: hashedPassword2,
      role: 'student',
      isFirstLogin: false,
      isActive: true
    });

    await admissionUser.save();
    console.log('Admission number test user created: 123456789');

    await mongoose.disconnect();
    console.log('Done');
  } catch (error) {
    console.error('Error:', error);
  }
}

createTestUsers();