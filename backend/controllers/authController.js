const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Student = require('../models/studentModel');

const jwtSecret = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const jwtOptions = { expiresIn: '1d' };

// Strict ID detection function
const detectIdType = (id) => {
  if (!id || typeof id !== 'string') {
    return null;
  }

  // Check if it's digits only (admission_number)
  if (/^\d+$/.test(id)) {
    return 'admission_number';
  }

  // Check if it matches registrar ID pattern
  if (/^(RNS|RSS|RMNS|RMSS)-\d+\/\d+$/.test(id)) {
    return 'registrar_id';
  }

  // Invalid format
  return null;
};

// Validate ID format
const isValidIdFormat = (id) => {
  return detectIdType(id) !== null;
};

// Find user by login ID with strict field matching
const findUserByLoginId = async (id) => {
  const idType = detectIdType(id);

  if (!idType) {
    return null; // Invalid ID format
  }

  // Query only the appropriate field based on detected type
  const query = {};
  query[idType] = id;

  console.log(`Looking for user with ${idType}: ${id}`);
  const user = await User.findOne(query);
  console.log('Found user:', user ? 'YES' : 'NO');

  return user;
};

// Find student by login ID (for auto-creation of users)
const findStudentByLoginId = async (id) => {
  const idType = detectIdType(id);

  if (!idType) {
    return null; // Invalid ID format
  }

  // Only admission numbers are supported for auto-creation from Student collection
  // Registrar IDs are for manually created admin/staff users
  if (idType !== 'admission_number') {
    return null;
  }

  const query = {};
  query.admissionNumber = id; // Use correct Student model field name

  return await Student.findOne(query);
};

const login = async (req, res) => {
  try {
    const { id, password } = req.body;

    if (!id || !password) {
      return res.status(400).json({
        success: false,
        message: 'ID and password are required',
      });
    }

    // Strict ID format validation
    const idType = detectIdType(id);
    if (!idType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. Use admission number (digits only) or registrar ID (e.g., RNS-123/2023)',
      });
    }

    // Find user with strict field matching
    let user = await findUserByLoginId(id);

    // If user not found in User collection and it's an admission number,
    // try to create from Student collection
    if (!user && idType === 'admission_number') {
      const student = await findStudentByLoginId(id);
      if (student) {
        user = new User({
          id,
          admission_number: id, // Store in correct User model field
          password: id, // Temporary password (will be changed on first login)
          role: 'student',
          isFirstLogin: true,
          isActive: true,
        });
        await user.save();
      }
    }

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    console.log('User found, checking password...');
    const passwordMatches = await bcrypt.compare(password, user.password);
    console.log('Password matches:', passwordMatches);

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (user.isFirstLogin) {
      return res.status(200).json({
        success: true,
        message: 'First login detected. Please change your password',
        requiresPasswordChange: true,
        user: {
          id: user.id,
          role: user.role,
          isFirstLogin: user.isFirstLogin,
        },
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        username: user.id,
      },
      jwtSecret,
      jwtOptions
    );

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const { id, oldPassword, newPassword, confirmPassword } = req.body;

    if (!id || !oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirm password do not match',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Strict ID format validation
    const idType = detectIdType(id);
    if (!idType) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format. Use admission number (digits only) or registrar ID (e.g., RNS-123/2023)',
      });
    }

    // Find user with strict field matching
    const user = await findUserByLoginId(id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const oldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!oldPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.id,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  login,
  changePassword,
  getCurrentUser,
};
