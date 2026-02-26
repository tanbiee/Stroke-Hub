import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiLock, FiLogIn, FiAlertCircle } from 'react-icons/fi';
import { GoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import API_BASE from '../config';
import './Auth.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth(); // Note: We might bypass this context login for Google, or create a specific function for it
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.post(`${API_BASE}/api/auth/google`, {
                googleToken: credentialResponse.credential,
            });

            // If backend verification succeeds, it returns standard session token
            localStorage.setItem('token', res.data.token);
            // Quick force reload to auth context can pick up the new token
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.response?.data?.message || 'Google Login failed. Please try again.');
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
                    <p className="auth-subtitle">Draw, guess, and have fun with friends!</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Welcome Back</h2>

                    {error && (
                        <div className="auth-error animate-fade-in">
                            <FiAlertCircle />
                            <span>{error}</span>
                        </div>
                    )}

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
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">Signing in...</span>
                        ) : (
                            <>
                                <FiLogIn /> Sign In
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
                            width="350"
                            text="signin_with"
                            shape="pill"
                        />
                    </div>

                    <p className="auth-switch">
                        Don't have an account? <Link to="/register">Sign Up</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
