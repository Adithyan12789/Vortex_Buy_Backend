const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendOtpEmail } = require('../utils/emailService');

// Generate JWT helper
const generateToken = (userId) => {
    return new Promise((resolve, reject) => {
        const payload = { user: { id: userId } };
        jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' }, (err, token) => {
            if (err) return reject(err);
            resolve(token);
        });
    });
};

// POST /register
exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ msg: 'Please provide all required fields' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({ email: normalizedEmail });

        if (user && user.isVerified) {
            return res.status(400).json({ msg: 'An account with this email already exists. Please sign in.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const otp = crypto.randomInt(100000, 999999).toString();
        const otpExpires = Date.now() + 15 * 60 * 1000; // 15 mins

        if (user && !user.isVerified) {
            // Update existing unverified user
            user.username = username.trim();
            user.password = hashedPassword;
            user.otp = otp;
            user.otpExpires = otpExpires;
            await user.save();
        } else {
            // Create new user
            user = new User({
                username: username.trim(),
                email: normalizedEmail,
                password: hashedPassword,
                otp,
                otpExpires,
                isVerified: false
            });
            await user.save();
        }

        console.log(`[Vortex-Buy Auth] Generated OTP for ${normalizedEmail}: ${otp}`);

        // Send REAL email via Nodemailer Gmail SMTP
        try {
            await sendOtpEmail(normalizedEmail, otp, user.username);
            console.log(`[Vortex-Buy Auth] Real email OTP dispatched to ${normalizedEmail}`);
        } catch (mailErr) {
            console.error('[Vortex-Buy Auth] Email delivery failed:', mailErr);
            return res.status(500).json({ 
                msg: `Failed to deliver verification email to ${normalizedEmail}. Please verify your email address or try again.` 
            });
        }
        
        res.status(200).json({
            msg: `Registration successful! A 6-digit verification code has been sent to ${normalizedEmail}.`,
            email: normalizedEmail
        });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ msg: 'Server error during registration' });
    }
};

// POST /verify-otp
exports.verifyOtp = async (req, res) => {
    const { email, otp } = req.body;
    try {
        if (!email || !otp) {
            return res.status(400).json({ msg: 'Email and verification code are required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ msg: 'No account found with this email' });
        }

        if (user.otp !== otp.toString().trim() || !user.otpExpires || user.otpExpires < Date.now()) {
            return res.status(400).json({ msg: 'Invalid or expired verification code' });
        }

        user.isVerified = true;
        user.otp = undefined;
        user.otpExpires = undefined;
        await user.save();

        const token = await generateToken(user._id);
        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            postalCode: user.postalCode || '',
            country: user.country || '',
            avatar: user.avatar || '',
            createdAt: user.createdAt
        };

        res.json({
            msg: 'Email successfully verified! Welcome to VortexBuy.',
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('Verify OTP error:', err);
        res.status(500).json({ msg: 'Server error during OTP verification' });
    }
};

// POST /resend-otp
exports.resendOtp = async (req, res) => {
    const { email } = req.body;
    try {
        if (!email) {
            return res.status(400).json({ msg: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(404).json({ msg: 'No account found with this email' });
        }

        if (user.isVerified) {
            return res.status(400).json({ msg: 'Account is already verified. Please sign in.' });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        user.otp = otp;
        user.otpExpires = Date.now() + 15 * 60 * 1000;
        await user.save();

        console.log(`[Vortex-Buy Auth] Resending OTP for ${normalizedEmail}: ${otp}`);

        await sendOtpEmail(normalizedEmail, otp, user.username);

        res.json({
            msg: `A new 6-digit verification code has been sent to ${normalizedEmail}.`,
            email: normalizedEmail
        });
    } catch (err) {
        console.error('Resend OTP error:', err);
        res.status(500).json({ msg: 'Failed to resend verification email. Please try again.' });
    }
};

// POST /login
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(400).json({ msg: 'Please provide both email and password' });
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            // Generate a fresh OTP for unverified user and send real email
            const otp = crypto.randomInt(100000, 999999).toString();
            user.otp = otp;
            user.otpExpires = Date.now() + 15 * 60 * 1000;
            await user.save();

            console.log(`[Vortex-Buy Auth] Sending verification email to unverified user ${normalizedEmail}: ${otp}`);
            try {
                await sendOtpEmail(normalizedEmail, otp, user.username);
            } catch (mailErr) {
                console.error('[Vortex-Buy Auth] Email delivery failed:', mailErr);
            }

            return res.status(400).json({
                msg: `Please verify your email first. A verification code was sent to ${normalizedEmail}.`,
                requiresVerification: true,
                email: normalizedEmail
            });
        }

        const token = await generateToken(user._id);
        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            postalCode: user.postalCode || '',
            country: user.country || '',
            avatar: user.avatar || '',
            createdAt: user.createdAt
        };

        res.json({
            msg: 'Login successful',
            token,
            user: safeUser
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ msg: 'Server error during login' });
    }
};

// GET /profile
exports.profile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
        if (!user) {
            return res.status(404).json({ msg: 'User profile not found' });
        }

        res.json(user);
    } catch (err) {
        console.error('Profile fetch error:', err);
        res.status(500).json({ msg: 'Server error fetching profile' });
    }
};

// PUT /profile
exports.updateProfile = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { username, phone, address, city, postalCode, country, avatar } = req.body;
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (username && username.trim()) user.username = username.trim();
        if (phone !== undefined) user.phone = phone.trim();
        if (address !== undefined) user.address = address.trim();
        if (city !== undefined) user.city = city.trim();
        if (postalCode !== undefined) user.postalCode = postalCode.trim();
        if (country !== undefined) user.country = country.trim();
        if (avatar !== undefined) user.avatar = avatar.trim();

        await user.save();

        const safeUser = {
            id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone || '',
            address: user.address || '',
            city: user.city || '',
            postalCode: user.postalCode || '',
            country: user.country || '',
            avatar: user.avatar || '',
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        res.json({
            msg: 'Profile updated successfully',
            user: safeUser
        });
    } catch (err) {
        console.error('Profile update error:', err);
        res.status(500).json({ msg: 'Server error updating profile' });
    }
};

// PUT /change-password
exports.changePassword = async (req, res) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ msg: 'Please provide current and new password' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ msg: 'New password must be at least 6 characters long' });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ msg: 'Password changed successfully' });
    } catch (err) {
        console.error('Change password error:', err);
        res.status(500).json({ msg: 'Server error changing password' });
    }
};