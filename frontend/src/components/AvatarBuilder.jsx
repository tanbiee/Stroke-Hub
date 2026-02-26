import { useState } from 'react';
import Avatar from './Avatar';
import {
    FACE_COLORS, EYES, MOUTHS, NOSES, HATS, EYE_COLORS,
    DEFAULT_AVATAR, getSavedAvatar, saveAvatar,
} from './avatarParts';
import { FiCheck } from 'react-icons/fi';
import './AvatarBuilder.css';

const CATEGORIES = [
    { key: 'faceColor', label: '🎨 Skin', count: FACE_COLORS.length },
    { key: 'eyes', label: '👁️ Eyes', count: EYES.length },
    { key: 'eyeColor', label: '🔵 Eye Color', count: EYE_COLORS.length },
    { key: 'mouth', label: '👄 Mouth', count: MOUTHS.length },
    { key: 'nose', label: '👃 Nose', count: NOSES.length },
    { key: 'hat', label: '🎩 Hat', count: HATS.length },
];

export default function AvatarBuilder({ onSave, initialConfig }) {
    const [config, setConfig] = useState(initialConfig || getSavedAvatar());
    const [activeTab, setActiveTab] = useState('faceColor');

    const handleChange = (key, value) => {
        setConfig(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = () => {
        saveAvatar(config);
        if (onSave) onSave(config);
    };

    const handleRandomize = () => {
        const randomConfig = {
            faceColor: Math.floor(Math.random() * FACE_COLORS.length),
            eyes: Math.floor(Math.random() * EYES.length),
            eyeColor: Math.floor(Math.random() * EYE_COLORS.length),
            mouth: Math.floor(Math.random() * MOUTHS.length),
            nose: Math.floor(Math.random() * NOSES.length),
            hat: Math.floor(Math.random() * HATS.length),
        };
        setConfig(randomConfig);
    };

    const activeCategory = CATEGORIES.find(c => c.key === activeTab);

    const renderOptionPreview = (key, index) => {
        const previewConfig = { ...config, [key]: index };
        return <Avatar config={previewConfig} size={52} />;
    };

    const renderColorOption = (key, index) => {
        const colors = key === 'faceColor' ? FACE_COLORS : EYE_COLORS;
        return (
            <div
                className="color-swatch"
                style={{ background: colors[index] }}
            />
        );
    };

    return (
        <div className="avatar-builder">
            {/* Live preview */}
            <div className="avatar-preview-area">
                <Avatar config={config} size={100} />
            </div>

            {/* Category tabs */}
            <div className="avatar-tabs">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.key}
                        className={`avatar-tab ${activeTab === cat.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(cat.key)}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Options grid */}
            <div className="avatar-options">
                {Array.from({ length: activeCategory.count }).map((_, i) => (
                    <button
                        key={i}
                        className={`avatar-option ${config[activeTab] === i ? 'selected' : ''}`}
                        onClick={() => handleChange(activeTab, i)}
                    >
                        {activeTab === 'faceColor' || activeTab === 'eyeColor'
                            ? renderColorOption(activeTab, i)
                            : renderOptionPreview(activeTab, i)
                        }
                        {config[activeTab] === i && <FiCheck className="option-check" />}
                    </button>
                ))}
            </div>

            {/* Actions */}
            <div className="avatar-actions">
                <button className="btn btn-secondary btn-sm" onClick={handleRandomize}>
                    🎲 Random
                </button>
                <button className="btn btn-primary btn-sm" onClick={handleSave}>
                    <FiCheck /> Save Avatar
                </button>
            </div>
        </div>
    );
}
