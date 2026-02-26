import { useEffect, useState } from 'react';
import './Confetti.css';

const COLORS = ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export default function Confetti() {
    const [pieces, setPieces] = useState([]);

    useEffect(() => {
        // Generate 80 confetti pieces
        const newPieces = Array.from({ length: 80 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100, // vw
            y: -10 - Math.random() * 20, // vh (start above screen)
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
            scale: 0.5 + Math.random() * 0.8,
            rotation: Math.random() * 360,
            speed: 2.5 + Math.random() * 4, // 2.5s to 6.5s fall time
            wiggle: Math.random() * 2 - 1,
            delay: Math.random() * 1.5, // stagger start times
            shape: Math.random() > 0.5 ? 'rect' : 'circle' // mix of rectangles and circles
        }));

        setPieces(newPieces);
    }, []);

    return (
        <div className="confetti-container">
            {pieces.map(p => (
                <div
                    key={p.id}
                    className={`confetti-piece ${p.shape === 'circle' ? 'circle' : ''}`}
                    style={{
                        left: `${p.x}vw`,
                        top: `${p.y}vh`,
                        backgroundColor: p.color,
                        width: `${10 * p.scale}px`,
                        height: `${p.shape === 'rect' ? 20 * p.scale : 10 * p.scale}px`,
                        animationDuration: `${p.speed}s`,
                        animationDelay: `${p.delay}s`,
                        '--start-rot': `${p.rotation}deg`,
                        '--end-rot': `${p.rotation + 360 + Math.random() * 360}deg`,
                        '--wiggle': `${p.wiggle * 80}px`,
                    }}
                />
            ))}
        </div>
    );
}
