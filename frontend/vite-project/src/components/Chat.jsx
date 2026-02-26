import { useState, useEffect, useRef } from 'react';
import { FiSend, FiThumbsUp, FiThumbsDown } from 'react-icons/fi';
import Avatar from './Avatar';
import { DEFAULT_AVATAR } from './avatarParts';
import './Chat.css';

export default function Chat({ roomId, socket, isConnected, user, gameState, isDrawer, users }) {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    // Reactions state: { thumbsUp: [{userId, username}], thumbsDown: [{userId, username}] }
    const [reactions, setReactions] = useState({ thumbsUp: [], thumbsDown: [] });
    const [reactionPopup, setReactionPopup] = useState(null); // 'thumbsUp' | 'thumbsDown' | null

    // Reaction toast notifications
    const [reactionToasts, setReactionToasts] = useState([]);

    // The drawer cannot chat during their turn (to prevent revealing the word)
    const isChatDisabled = gameState && isDrawer;

    // Helper: find avatar for a userId from users array
    const getAvatarForUser = (userId) => {
        const u = users?.find(u => u.userId === userId);
        return u?.avatar || DEFAULT_AVATAR;
    };

    // Listen for chat messages
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (msg) => {
            setMessages(prev => [...prev, msg]);
        };

        const handleSystemMessage = (msg) => {
            setMessages(prev => [...prev, { ...msg, type: 'system' }]);
        };

        const handleCorrectGuess = ({ username }) => {
            setMessages(prev => [...prev, {
                type: 'correct',
                message: `${username} guessed the word! 🎉`,
                timestamp: Date.now(),
            }]);
        };

        // Reaction events
        const handleReactionUpdate = (updatedReactions) => {
            setReactions(updatedReactions);
        };

        // Reaction notification — shows toast to everyone when someone reacts
        const handleReactionNotify = ({ username, type, userId: reactorId }) => {
            // Don't show toast for own reactions
            if (reactorId === user?.id) return;

            const emoji = type === 'thumbsUp' ? '👍' : '👎';
            const label = type === 'thumbsUp' ? 'liked' : 'disliked';
            const id = Date.now() + Math.random();
            const toast = { id, message: `${username} ${label} the drawing ${emoji}`, type };

            setReactionToasts(prev => [...prev, toast]);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                setReactionToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };

        socket.on('chat-message', handleChatMessage);
        socket.on('system-message', handleSystemMessage);
        socket.on('correct-guess', handleCorrectGuess);
        socket.on('reaction-update', handleReactionUpdate);
        socket.on('reaction-notify', handleReactionNotify);

        return () => {
            socket.off('chat-message', handleChatMessage);
            socket.off('system-message', handleSystemMessage);
            socket.off('correct-guess', handleCorrectGuess);
            socket.off('reaction-update', handleReactionUpdate);
            socket.off('reaction-notify', handleReactionNotify);
        };
    }, [socket, user]);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Close reaction popup when clicking outside
    useEffect(() => {
        if (!reactionPopup) return;
        const handleClick = () => setReactionPopup(null);
        const timer = setTimeout(() => document.addEventListener('click', handleClick), 100);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('click', handleClick);
        };
    }, [reactionPopup]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || !socket || !isConnected || isChatDisabled) return;

        const msgData = {
            roomId,
            message: input.trim(),
            userId: user.id,
            username: user.username,
        };

        // If game is active, this might be a guess
        if (gameState) {
            socket.emit('guess-word', msgData);
        } else {
            socket.emit('send-message', msgData);
        }

        setInput('');
    };

    const handleReaction = (type) => {
        if (!socket || !isConnected) return;
        socket.emit('reaction', {
            roomId,
            type,
            userId: user.id,
            username: user.username,
        });
    };

    const togglePopup = (type, e) => {
        e.stopPropagation();
        setReactionPopup(prev => prev === type ? null : type);
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="chat-panel">
            {/* Reaction toast notifications */}
            <div className="reaction-toast-container">
                {reactionToasts.map(toast => (
                    <div key={toast.id} className={`reaction-toast ${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>

            <div className="chat-header">
                <h4>{isChatDisabled ? '🎨 You are drawing!' : gameState ? '💬 Guess the word!' : '💬 Chat'}</h4>

                {/* Reaction buttons */}
                <div className="reaction-bar">
                    <div className="reaction-btn-wrapper">
                        <button
                            className={`reaction-btn ${reactions.thumbsUp.some(r => r.userId === user?.id) ? 'active' : ''}`}
                            onClick={(e) => { handleReaction('thumbsUp'); togglePopup('thumbsUp', e); }}
                            title="Thumbs up"
                        >
                            <FiThumbsUp size={14} />
                            {reactions.thumbsUp.length > 0 && (
                                <span className="reaction-count">{reactions.thumbsUp.length}</span>
                            )}
                        </button>
                        {reactionPopup === 'thumbsUp' && reactions.thumbsUp.length > 0 && (
                            <div className="reaction-popup" onClick={e => e.stopPropagation()}>
                                <div className="reaction-popup-title">👍 Liked by</div>
                                {reactions.thumbsUp.map(r => (
                                    <div key={r.userId} className="reaction-popup-user">
                                        {r.username}{r.userId === user?.id ? ' (You)' : ''}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="reaction-btn-wrapper">
                        <button
                            className={`reaction-btn dislike ${reactions.thumbsDown.some(r => r.userId === user?.id) ? 'active' : ''}`}
                            onClick={(e) => { handleReaction('thumbsDown'); togglePopup('thumbsDown', e); }}
                            title="Thumbs down"
                        >
                            <FiThumbsDown size={14} />
                            {reactions.thumbsDown.length > 0 && (
                                <span className="reaction-count">{reactions.thumbsDown.length}</span>
                            )}
                        </button>
                        {reactionPopup === 'thumbsDown' && reactions.thumbsDown.length > 0 && (
                            <div className="reaction-popup" onClick={e => e.stopPropagation()}>
                                <div className="reaction-popup-title">👎 Disliked by</div>
                                {reactions.thumbsDown.map(r => (
                                    <div key={r.userId} className="reaction-popup-user">
                                        {r.username}{r.userId === user?.id ? ' (You)' : ''}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <p>No messages yet. Say hello! 👋</p>
                    </div>
                )}

                {messages.map((msg, i) => (
                    <div key={i} className={`chat-msg ${msg.type || ''} ${msg.userId === user?.id ? 'own' : ''}`}>
                        {msg.type === 'system' ? (
                            <span className="msg-system">{msg.message}</span>
                        ) : msg.type === 'correct' ? (
                            <span className="msg-correct">{msg.message}</span>
                        ) : (
                            <div className="msg-with-avatar">
                                <Avatar config={getAvatarForUser(msg.userId)} size={28} className="msg-avatar" />
                                <div className="msg-content">
                                    <div className="msg-header">
                                        <span className="msg-username">
                                            {msg.username} {msg.userId === user?.id && <span className="you-badge">(You)</span>}
                                        </span>
                                        {msg.timestamp && <span className="msg-time">{formatTime(msg.timestamp)}</span>}
                                    </div>
                                    <p className="msg-text">{msg.message}</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={handleSend}>
                <input
                    type="text"
                    className="input-field chat-input"
                    placeholder={
                        isChatDisabled
                            ? "You can't chat while drawing!"
                            : gameState
                                ? 'Type your guess...'
                                : 'Type a message...'
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={100}
                    disabled={isChatDisabled}
                />
                <button type="submit" className="btn-icon chat-send" disabled={!input.trim() || isChatDisabled}>
                    <FiSend />
                </button>
            </form>
        </div>
    );
}
