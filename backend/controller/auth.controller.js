import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../model/User.model.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const hashed = await bcrypt.hash(password, 10);
        const user = await User.create({
            username,
            email,
            password: hashed,
        });
        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ message: "Error registering user", error: err.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
            }, process.env.JWT_SECRET, { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Login successful", token });
    } catch (err) {
        res.status(500).json({ message: "Error during login", error: err.message });
    }
}

export const googleAuth = async (req, res) => {
    try {
        const { googleToken } = req.body;

        if (!googleToken) {
            return res.status(400).json({ message: "Google token is required" });
        }

        // 1. Verify the Google Token
        const ticket = await googleClient.verifyIdToken({
            idToken: googleToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { email, name, sub: googleId } = payload;

        // 2. Check if user already exists
        let user = await User.findOne({ email });

        if (!user) {
            // 3. User doesn't exist, create a new one without a password
            user = await User.create({
                username: name || `User${Math.floor(Math.random() * 10000)}`,
                email: email,
                googleId: googleId,
            });
        } else if (!user.googleId) {
            // If they exist but signed up manually, link their Google account
            user.googleId = googleId;
            await user.save();
        }

        // 4. Generate standard JWT token for the session
        const token = jwt.sign(
            {
                id: user._id,
                username: user.username,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        res.status(200).json({ message: "Google Login successful", token });
    } catch (err) {
        res.status(500).json({ message: "Google Authentication failed", error: err.message });
    }
};