// SVG avatar parts for mix-and-match avatar builder
// Each part is a function that returns an SVG group element

// ===== FACE COLORS =====
export const FACE_COLORS = [
    '#FFD8B1', // light
    '#F4C28C', // warm
    '#D4956A', // tan
    '#8D5524', // brown
];

// ===== EYES (4 styles) =====
export const EYES = [
    // 0: Round eyes
    (color = '#333') => (
        <g key="eyes-round">
            <circle cx="35" cy="42" r="5" fill="white" />
            <circle cx="65" cy="42" r="5" fill="white" />
            <circle cx="36" cy="42" r="3" fill={color} />
            <circle cx="66" cy="42" r="3" fill={color} />
            <circle cx="37" cy="41" r="1" fill="white" />
            <circle cx="67" cy="41" r="1" fill="white" />
        </g>
    ),
    // 1: Sleepy/happy eyes
    (color = '#333') => (
        <g key="eyes-happy">
            <path d="M28 42 Q35 36 42 42" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M58 42 Q65 36 72 42" stroke={color} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
    ),
    // 2: Big sparkly eyes
    (color = '#333') => (
        <g key="eyes-big">
            <ellipse cx="35" cy="42" rx="7" ry="8" fill="white" />
            <ellipse cx="65" cy="42" rx="7" ry="8" fill="white" />
            <circle cx="36" cy="43" r="5" fill={color} />
            <circle cx="66" cy="43" r="5" fill={color} />
            <circle cx="38" cy="40" r="2" fill="white" />
            <circle cx="68" cy="40" r="2" fill="white" />
            <circle cx="34" cy="44" r="1" fill="white" />
            <circle cx="64" cy="44" r="1" fill="white" />
        </g>
    ),
    // 3: Cool/squint eyes
    (color = '#333') => (
        <g key="eyes-cool">
            <rect x="27" y="39" width="16" height="6" rx="3" fill="white" />
            <rect x="57" y="39" width="16" height="6" rx="3" fill="white" />
            <circle cx="35" cy="42" r="3" fill={color} />
            <circle cx="65" cy="42" r="3" fill={color} />
        </g>
    ),
];

// ===== MOUTHS (4 styles) =====
export const MOUTHS = [
    // 0: Smile
    () => (
        <g key="mouth-smile">
            <path d="M38 60 Q50 72 62 60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </g>
    ),
    // 1: Open smile
    () => (
        <g key="mouth-open">
            <path d="M38 58 Q50 72 62 58" stroke="#333" strokeWidth="2" fill="#FF6B6B" strokeLinecap="round" />
            <path d="M42 62 Q50 56 58 62" fill="white" />
        </g>
    ),
    // 2: Tongue out
    () => (
        <g key="mouth-tongue">
            <path d="M38 60 Q50 70 62 60" stroke="#333" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <ellipse cx="50" cy="66" rx="5" ry="4" fill="#FF6B6B" />
        </g>
    ),
    // 3: Straight face
    () => (
        <g key="mouth-flat">
            <line x1="40" y1="62" x2="60" y2="62" stroke="#333" strokeWidth="2.5" strokeLinecap="round" />
        </g>
    ),
];

// ===== NOSES (4 styles) =====
export const NOSES = [
    // 0: Small dot
    () => (
        <g key="nose-dot">
            <circle cx="50" cy="52" r="2" fill="#c9967a" />
        </g>
    ),
    // 1: Triangle
    () => (
        <g key="nose-tri">
            <path d="M50 48 L46 55 L54 55 Z" fill="#c9967a" opacity="0.6" />
        </g>
    ),
    // 2: Round bump
    () => (
        <g key="nose-round">
            <ellipse cx="50" cy="52" rx="4" ry="3" fill="#c9967a" opacity="0.5" />
        </g>
    ),
    // 3: Button nose
    () => (
        <g key="nose-button">
            <circle cx="50" cy="52" r="3" fill="none" stroke="#c9967a" strokeWidth="1.5" />
        </g>
    ),
];

// ===== HATS (4 styles + none) =====
export const HATS = [
    // 0: None
    () => null,
    // 1: Baseball cap
    (faceColor = '#FFD8B1') => (
        <g key="hat-cap">
            <ellipse cx="50" cy="22" rx="32" ry="10" fill="#8B5CF6" />
            <rect x="18" y="18" width="64" height="12" rx="4" fill="#8B5CF6" />
            <rect x="14" y="26" width="28" height="5" rx="2" fill="#7C3AED" />
        </g>
    ),
    // 2: Beanie
    (faceColor = '#FFD8B1') => (
        <g key="hat-beanie">
            <path d="M22 30 Q22 8 50 8 Q78 8 78 30" fill="#EF4444" />
            <rect x="20" y="26" width="60" height="8" rx="4" fill="#DC2626" />
            <circle cx="50" cy="8" r="4" fill="#EF4444" />
        </g>
    ),
    // 3: Top hat
    (faceColor = '#FFD8B1') => (
        <g key="hat-top">
            <rect x="32" y="2" width="36" height="26" rx="3" fill="#1F2937" />
            <rect x="22" y="24" width="56" height="6" rx="3" fill="#1F2937" />
            <rect x="34" y="20" width="32" height="4" fill="#8B5CF6" />
        </g>
    ),
    // 4: Crown
    (faceColor = '#FFD8B1') => (
        <g key="hat-crown">
            <path d="M25 28 L30 10 L38 22 L50 6 L62 22 L70 10 L75 28 Z" fill="#F59E0B" />
            <rect x="25" y="24" width="50" height="6" rx="2" fill="#D97706" />
            <circle cx="38" cy="14" r="2" fill="#EF4444" />
            <circle cx="50" cy="9" r="2" fill="#3B82F6" />
            <circle cx="62" cy="14" r="2" fill="#10B981" />
        </g>
    ),
];

// ===== EYE COLORS =====
export const EYE_COLORS = ['#333333', '#2563EB', '#10B981', '#8B5CF6'];

// Default avatar config
export const DEFAULT_AVATAR = {
    faceColor: 0,
    eyes: 0,
    eyeColor: 0,
    mouth: 0,
    nose: 0,
    hat: 0,
};

// Get saved avatar from localStorage or default
export function getSavedAvatar() {
    try {
        const saved = localStorage.getItem('strokehub-avatar');
        if (saved) return JSON.parse(saved);
    } catch { }
    return { ...DEFAULT_AVATAR };
}

// Save avatar to localStorage
export function saveAvatar(config) {
    localStorage.setItem('strokehub-avatar', JSON.stringify(config));
}
