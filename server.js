const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const allowedOrigins = new Set([
  'https://sketchbeautysalon.netlify.app',
  ...(process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean)
]);

// Middleware
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    return callback(null, allowedOrigins.has(origin));
  }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from current directory
app.use(express.static(__dirname));

// MongoDB Atlas Connection
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Successfully connected to MongoDB Atlas'))
  .catch((err) => {
    console.error('❌ MongoDB Atlas Connection Error:', err.message);
    console.log('💡 Please check your MONGODB_URI connection string in .env file');
  });

// Define Submission Schema & Model
const submissionSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  emailAddr: { type: String, required: true },
  phoneNum: { type: String, required: true },
  cityServed: { type: String, default: 'Central City' },
  serviceType: { type: String, default: 'General Inquiry' },
  preferredDate: { type: String, default: 'Not specified' },
  userMessage: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Submission = mongoose.model('Submission', submissionSchema);

function requireAdmin(req, res, next) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const authorization = req.get('authorization') || '';
  const suppliedPassword = authorization.startsWith('Bearer ')
    ? authorization.slice('Bearer '.length)
    : '';

  if (!expectedPassword) {
    return res.status(503).json({ success: false, message: 'Admin access is not configured.' });
  }

  const expected = Buffer.from(expectedPassword);
  const supplied = Buffer.from(suppliedPassword);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ success: false, message: 'Admin authentication required.' });
  }

  return next();
}

// --- REST API ENDPOINTS ---

app.post('/api/admin/login', (req, res) => {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const suppliedPassword = req.body.password;

  if (!expectedPassword) {
    return res.status(503).json({ success: false, message: 'Admin access is not configured.' });
  }

  if (typeof suppliedPassword !== 'string') {
    return res.status(400).json({ success: false, message: 'A password is required.' });
  }

  const expected = Buffer.from(expectedPassword);
  const supplied = Buffer.from(suppliedPassword);
  if (expected.length !== supplied.length || !crypto.timingSafeEqual(expected, supplied)) {
    return res.status(401).json({ success: false, message: 'Invalid admin password.' });
  }

  return res.status(200).json({ success: true });
});

// 1. Submit contact form data
app.post('/api/contact', async (req, res) => {
  try {
    const { fullName, emailAddr, phoneNum, cityServed, serviceType, preferredDate, userMessage } = req.body;

    if (!fullName || !emailAddr || !phoneNum) {
      return res.status(400).json({ success: false, message: 'Please provide full name, email, and phone number.' });
    }

    const newSubmission = new Submission({
      fullName,
      emailAddr,
      phoneNum,
      cityServed,
      serviceType,
      preferredDate,
      userMessage
    });

    const savedSubmission = await newSubmission.save();
    return res.status(201).json({
      success: true,
      message: 'Appointment request submitted successfully!',
      data: savedSubmission
    });
  } catch (error) {
    console.error('Error saving submission:', error);
    return res.status(500).json({ success: false, message: 'Failed to process request on server.' });
  }
});

// 2. Get all submissions (for Admin Panel)
app.get('/api/submissions', requireAdmin, async (req, res) => {
  try {
    const submissions = await Submission.find().sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    return res.status(500).json({ success: false, message: 'Error retrieving submissions.' });
  }
});

// 3. Mark a submission as read / unread
app.patch('/api/submissions/:id/read', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const updatedSubmission = await Submission.findByIdAndUpdate(
      id,
      { isRead: isRead !== undefined ? isRead : true },
      { new: true }
    );

    if (!updatedSubmission) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Status updated successfully.',
      data: updatedSubmission
    });
  } catch (error) {
    console.error('Error updating status:', error);
    return res.status(500).json({ success: false, message: 'Error updating status.' });
  }
});

// 4. Delete submission endpoint (Optional handy action)
app.delete('/api/submissions/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Submission.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Submission not found.' });
    }
    return res.status(200).json({ success: true, message: 'Submission deleted.' });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error deleting submission.' });
  }
});

// Serve main page for any unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server with auto-fallback if port is busy
const startServer = (portToUse) => {
  const server = app.listen(portToUse, () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Sketch Beauty Salon Server running at http://localhost:${portToUse}`);
    console.log(`==================================================\n`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`⚠️ Port ${portToUse} is in use. Trying port ${Number(portToUse) + 1}...`);
      startServer(Number(portToUse) + 1);
    } else {
      console.error('❌ Server startup error:', err);
    }
  });
};

startServer(PORT);
