import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiMail, FiLock, FiUserPlus, FiAlertCircle } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './Auth.css';

export default function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await register(username, email, password);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`http://localhost:3000/api/auth/google`, {
                googleToken: credentialResponse.credential,
            });

            // If backend verification succeeds, it returns standard session token
            localStorage.setItem('token', res.data.token);
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Google Sign-up failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Google authentication was cancelled or failed.');
    };

    return (
        <div className="auth-page">
            <div className="auth-bg-decor">
                <div className="decor-circle decor-circle-1"></div>
                <div className="decor-circle decor-circle-2"></div>
                <div className="decor-circle decor-circle-3"></div>
            </div>

            <div className="auth-container animate-fade-in">
                <div className="auth-header">
                    <div className="auth-logo">
                        <span className="logo-icon">🎨</span>
                        <h1>StrokeHub</h1>
                    </div>
                    <p className="auth-subtitle">Join the fun — draw and guess with friends!</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Create Account</h2>

                    {error && (
                        <div className="auth-error animate-fade-in">
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="username">Username</label>
                        <div className="input-with-icon">
                            <FiUser className="input-icon" />
                            <input
                                id="username"
                                type="text"
                                className="input-field"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>
                        <div className="input-with-icon">
                            <FiMail className="input-icon" />
                            <input
                                id="email"
                                type="email"
                                className="input-field"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                id="password"
                                type="password"
                                className="input-field"
                                placeholder="Create a password (min 6 chars)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <div className="input-with-icon">
                            <FiLock className="input-icon" />
                            <input
                                id="confirmPassword"
                                type="password"
                                className="input-field"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">Creating account...</span>
                        ) : (
                            <>
                                <FiUserPlus /> Sign Up
                            </>
                        )}
                    </button>

                    <div className="auth-separator">
                        <span>OR</span>
                    </div>

                    <div className="google-btn-wrapper">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_black"
                            width="100%"
                            text="signup_with"
                            shape="pill"
                        />
                    </div>

                    <p className="auth-switch">
                        Already have an account? <Link to="/login">Sign In</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
