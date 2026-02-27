import Avatar from './Avatar';
import { DEFAULT_AVATAR } from './avatarParts';
import { FiX, FiMic, FiMicOff } from 'react-icons/fi';
import './UserPresence.css';

export default function UserPresence({ users, hostId, currentUserId, onKickPlayer, speakingUsers, isMicOn, onToggleMic, drawerId }) {
    const isHost = hostId === currentUserId;

    return (
        <div className="user-presence">
            <h4 className="presence-title">Players ({users.length})</h4>
            <div className="presence-list">
                {users.map((u) => {
                    const isSpeaking = speakingUsers?.has(u.userId);
                    const isDrawing = drawerId === u.userId;
                    return (
                        <div key={u.userId} className={`presence-item ${u.userId === currentUserId ? 'is-me' : ''}`}>
                            <div className={`presence-avatar-wrap ${isSpeaking ? 'is-speaking' : ''}`}>
                                <Avatar config={u.avatar || DEFAULT_AVATAR} size={32} />
                                <span className="presence-dot"></span>
                            </div>
                            <div className="presence-info">
                                <span className="presence-name">
                                    {u.username}
                                    {u.userId === currentUserId && ' (You)'}
                                </span>
                                {isDrawing && (
                                    <span className="badge badge-drawer">🎨 Drawing</span>
                                )}
                                {u.userId === hostId && (
                                    <span className="badge badge-host">Host</span>
                                )}
                            </div>
                            {u.userId === currentUserId && (
                                <button className="mic-toggle-btn" onClick={onToggleMic} title={isMicOn ? "Mute Microphone" : "Unmute Microphone"}>
                                    {isMicOn ? <FiMic size={14} /> : <FiMicOff size={14} className="muted-icon" />}
                                </button>
                            )}
                            {isHost && u.userId !== currentUserId && (
                                <button
                                    className="kick-btn"
                                    onClick={() => onKickPlayer(u.userId)}
                                    title={`Kick ${u.username}`}
                                >
                                    <FiX size={14} />
                                </button>
                            )}
                        </div>
                    );
                })}

                {users.length === 0 && (
                    <p className="presence-empty">No one else is here yet...</p>
                )}
            </div>
        </div>
    );
}
