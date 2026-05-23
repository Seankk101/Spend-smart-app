const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Twilio Client
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

// Store OTP codes in memory (in production, use a database)
const otpStore = new Map();

// Generate random 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running' });
});

// Send OTP via SMS
app.post('/api/send-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        // Validate phone number format
        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        // Generate OTP
        const otp = generateOTP();
        
        // Store OTP with expiration (10 minutes)
        otpStore.set(phoneNumber, {
            code: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // Send SMS via Twilio
        await client.messages.create({
            body: `Your SpendSmart verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        res.json({ 
            success: true, 
            message: 'OTP sent successfully',
            phoneNumber: phoneNumber.slice(-4) // Return last 4 digits for confirmation
        });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to send OTP'
        });
    }
});

// Verify OTP
app.post('/api/verify-otp', (req, res) => {
    try {
        const { phoneNumber, otp } = req.body;

        // Validate input
        if (!phoneNumber || !otp) {
            return res.status(400).json({ error: 'Phone number and OTP required' });
        }

        // Check if OTP exists
        const otpData = otpStore.get(phoneNumber);
        if (!otpData) {
            return res.status(400).json({ error: 'No OTP sent for this number' });
        }

        // Check if OTP expired
        if (Date.now() > otpData.expiresAt) {
            otpStore.delete(phoneNumber);
            return res.status(400).json({ error: 'OTP expired. Please request a new one.' });
        }

        // Verify OTP
        if (otpData.code !== otp) {
            return res.status(400).json({ error: 'Invalid OTP. Try again.' });
        }

        // OTP verified successfully
        otpStore.delete(phoneNumber); // Delete used OTP

        res.json({ 
            success: true, 
            message: 'Phone verified successfully',
            verified: true
        });

    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to verify OTP'
        });
    }
});

// Resend OTP (same as send-otp)
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { phoneNumber } = req.body;

        if (!phoneNumber || phoneNumber.length < 10) {
            return res.status(400).json({ error: 'Invalid phone number' });
        }

        const otp = generateOTP();
        otpStore.set(phoneNumber, {
            code: otp,
            createdAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000
        });

        await client.messages.create({
            body: `Your SpendSmart verification code is: ${otp}. Valid for 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });

        res.json({ 
            success: true, 
            message: 'New OTP sent successfully'
        });

    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ 
            error: error.message || 'Failed to resend OTP'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 SMS Verification Server running on http://localhost:${PORT}`);
    console.log('📱 Ready to send OTP codes via Twilio');
});
