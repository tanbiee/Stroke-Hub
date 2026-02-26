import { FACE_COLORS, EYES, MOUTHS, NOSES, HATS, EYE_COLORS, DEFAULT_AVATAR } from './avatarParts';

// Renders a complete avatar SVG from a config object
export default function Avatar({ config = DEFAULT_AVATAR, size = 40, className = '' }) {
    const faceColor = FACE_COLORS[config.faceColor] || FACE_COLORS[0];
    const eyeColor = EYE_COLORS[config.eyeColor] || EYE_COLORS[0];

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            className={`avatar-svg ${className}`}
            style={{ borderRadius: '50%', overflow: 'hidden' }}
        >
            {/* Background circle */}
            <circle cx="50" cy="50" r="50" fill={faceColor} opacity="0.2" />

            {/* Face */}
            <circle cx="50" cy="48" r="30" fill={faceColor} />

            {/* Body/neck hint */}
            <ellipse cx="50" cy="90" rx="25" ry="16" fill={faceColor} />

            {/* Nose (behind eyes layer) */}
            {NOSES[config.nose] ? NOSES[config.nose]() : null}

            {/* Eyes */}
            {EYES[config.eyes] ? EYES[config.eyes](eyeColor) : null}

            {/* Mouth */}
            {MOUTHS[config.mouth] ? MOUTHS[config.mouth]() : null}

            {/* Hat (on top) */}
            {HATS[config.hat] ? HATS[config.hat](faceColor) : null}
        </svg>
    );
}
