import './WordHint.css';

export default function WordHint({ word, isDrawer }) {
    if (!word) return null;

    // If drawer, show full word; if guesser, show underscores
    const display = isDrawer
        ? word
        : word.split('').map(ch => (ch === ' ' ? '  ' : '_')).join(' ');

    return (
        <div className={`word-hint ${isDrawer ? 'drawer' : 'guesser'}`}>
            <span className="hint-label">{isDrawer ? 'Draw:' : 'Guess:'}</span>
            <span className="hint-word">{display}</span>
        </div>
    );
}
