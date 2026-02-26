import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import Avatar from '../components/Avatar';
import AvatarBuilder from '../components/AvatarBuilder';
import { getSavedAvatar } from '../components/avatarParts';
import { FiPlus, FiLogIn, FiLogOut, FiSun, FiMoon, FiCopy, FiCheck, FiEdit2, FiX } from 'react-icons/fi';
import './Dashboard.css';

const API_URL = 'http://localhost:3000/api/room';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [joinRoomId, setJoinRoomId] = useState('');
    const [createdRoom, setCreatedRoom] = useState('');
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showAvatarBuilder, setShowAvatarBuilder] = useState(false);
    const [avatarConfig, setAvatarConfig] = useState(getSavedAvatar());

    const generateRoomId = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const handleCreateRoom = async () => {
        setError('');
        setLoading(true);
        const newRoomId = generateRoomId();

        try {
            await axios.post(`${API_URL}/create`, { roomId: newRoomId });
            setCreatedRoom(newRoomId);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create room');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setError('');

        if (!joinRoomId.trim()) {
            setError('Please enter a room ID');
            return;
        }

        try {
            await axios.get(`${API_URL}/${joinRoomId.trim()}`);
            await axios.post(`${API_URL}/${joinRoomId.trim()}/join`);
            navigate(`/room/${joinRoomId.trim()}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Room not found');
        }
    };

    const handleGoToRoom = async () => {
        try {
            await axios.post(`${API_URL}/${createdRoom}/join`);
        } catch (err) {
            // Host is already a participant from creation, ignore
        }
        navigate(`/room/${createdRoom}`);
    };

    const handleCopyRoomId = () => {
        navigator.clipboard.writeText(createdRoom);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const handleAvatarSave = (config) => {
        setAvatarConfig(config);
        setShowAvatarBuilder(false);
    };

    return (
        <div className="dashboard-page">
            <div className="auth-bg-decor">
                <div className="decor-circle decor-circle-1"></div>
                <div className="decor-circle decor-circle-2"></div>
            </div>

            {/* Top Bar */}
            <header className="dashboard-header">
                <div className="dashboard-brand">
                    <span className="logo-icon">🎨</span>
                    <h1>StrokeHub</h1>
                </div>
                <div className="dashboard-actions">
                    <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
                        {theme === 'dark' ? <FiSun /> : <FiMoon />}
                    </button>
                    <div className="user-info" onClick={() => setShowAvatarBuilder(true)} title="Customize avatar">
                        <Avatar config={avatarConfig} size={36} />
                        <span className="user-name">{user?.username}</span>
                        <FiEdit2 size={12} className="edit-avatar-hint" />
                    </div>
                    <button className="btn btn-secondary btn-sm" onClick={handleLogout}>
                        <FiLogOut /> Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="dashboard-main">
                <div className="dashboard-welcome animate-fade-in">
                    <h2>Welcome, <span className="accent-text">{user?.username}</span>! 👋</h2>
                    <p>Create a new room or join an existing one to start drawing</p>
                </div>

                {error && (
                    <div className="toast toast-error animate-fade-in" style={{ position: 'relative', top: 0, right: 0, marginBottom: '16px' }}>
                        {error}
                    </div>
                )}

                <div className="dashboard-cards">
                    {/* Customize Avatar Card */}
                    <div className="glass-card dashboard-card animate-fade-in" style={{ animationDelay: '0.05s' }}>
                        <div className="card-icon">🧑‍🎨</div>
                        <h3>Your Avatar</h3>
                        <p>Customize your look with different features</p>

                        <div className="avatar-card-preview" onClick={() => setShowAvatarBuilder(true)}>
                            <Avatar config={avatarConfig} size={80} />
                            <button className="btn btn-secondary btn-sm">
                                <FiEdit2 /> Customize
                            </button>
                        </div>
                    </div>

                    {/* Create Room Card */}
                    <div className="glass-card dashboard-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
                        <div className="card-icon">🏠</div>
                        <h3>Create Room</h3>
                        <p>Start a new whiteboard room and invite friends</p>

                        {createdRoom ? (
                            <div className="created-room-info">
                                <div className="room-id-display">
                                    <span className="room-id-label">Room ID</span>
                                    <div className="room-id-value">
                                        <code>{createdRoom}</code>
                                        <button className="btn-icon" onClick={handleCopyRoomId}>
                                            {copied ? <FiCheck /> : <FiCopy />}
                                        </button>
                                    </div>
                                </div>
                                <button className="btn btn-primary" onClick={handleGoToRoom}>
                                    Enter Room →
                                </button>
                            </div>
                        ) : (
                            <button className="btn btn-primary" onClick={handleCreateRoom} disabled={loading}>
                                <FiPlus /> {loading ? 'Creating...' : 'Create New Room'}
                            </button>
                        )}
                    </div>

                    {/* Join Room Card */}
                    <div className="glass-card dashboard-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        <div className="card-icon">🚪</div>
                        <h3>Join Room</h3>
                        <p>Enter a Room ID to join an existing whiteboard</p>

                        <form onSubmit={handleJoinRoom} className="join-form">
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter Room ID"
                                value={joinRoomId}
                                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                                maxLength={10}
                            />
                            <button type="submit" className="btn btn-primary">
                                <FiLogIn /> Join Room
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            {/* How To Play Section (Gen-Z Flavor) */}
            <section className="how-to-play-section">
                <h2 className="htp-title">How to Slay at StrokeHub </h2> <h2>💅✨</h2>
                <div className="htp-grid">
                    <div className="htp-card glass-card">
                        <div className="htp-icon">🎙️</div>
                        <h3>1. Join & Yap</h3>
                        <p>Create a room, send the code to the group chat, and <strong>turn your mic on</strong>. It's giving podcast, but with terrible markers.</p>
                    </div>
                    <div className="htp-card glass-card">
                        <div className="htp-icon">👩‍🎨</div>
                        <h3>2. Channel your inner Picasso</h3>
                        <p>When it's your turn, pick a word and draw it before the timer runs out. Use the paint bucket if you're lazy. No letters allowed (don't be that guy).</p>
                    </div>
                    <div className="htp-card glass-card">
                        <div className="htp-icon">🕵️</div>
                        <h3>3. Guess & Brain rot</h3>
                        <p>Not drawing? Spam the chat with guesses. The faster you guess correctly, the more points you finesse. First place gets the confetti drop 🎉.</p>
                    </div>
                </div>
            </section>

            {/* Avatar Builder Modal */}
            {showAvatarBuilder && (
                <div className="avatar-modal-overlay" onClick={() => setShowAvatarBuilder(false)}>
                    <div className="glass-card avatar-modal" onClick={e => e.stopPropagation()}>
                        <button className="btn-icon avatar-modal-close" onClick={() => setShowAvatarBuilder(false)}>
                            <FiX />
                        </button>
                        <h3>🧑‍🎨 Customize Your Avatar</h3>
                        <AvatarBuilder onSave={handleAvatarSave} initialConfig={avatarConfig} />
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="dashboard-footer">
                <p>Built with <span className="footer-heart">❤️</span> by the Shalini Singh</p>
            </footer>
        </div>
    );
}
