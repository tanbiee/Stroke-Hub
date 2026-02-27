import { useRef, useCallback } from 'react';

/**
 * Synthesized sound effects using Web Audio API — no external files needed.
 */
export default function useSoundEffects() {
    const ctxRef = useRef(null);

    const getCtx = () => {
        if (!ctxRef.current) {
            ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        // Resume if suspended (autoplay policy)
        if (ctxRef.current.state === 'suspended') {
            ctxRef.current.resume();
        }
        return ctxRef.current;
    };

    // Helper: play a tone
    const playTone = (freq, duration, type = 'sine', volume = 0.3, delay = 0) => {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
    };

    // 🎮 Game Start — ascending chime
    const playGameStart = useCallback(() => {
        playTone(523, 0.15, 'sine', 0.25, 0);      // C5
        playTone(659, 0.15, 'sine', 0.25, 0.12);    // E5
        playTone(784, 0.15, 'sine', 0.25, 0.24);    // G5
        playTone(1047, 0.3, 'sine', 0.3, 0.36);     // C6
    }, []);

    // ✅ Correct Guess — cheerful double-pop
    const playCorrectGuess = useCallback(() => {
        playTone(880, 0.12, 'sine', 0.25, 0);       // A5
        playTone(1175, 0.18, 'sine', 0.3, 0.1);     // D6
        playTone(1397, 0.25, 'triangle', 0.2, 0.2);  // F6
    }, []);

    // 🎊 Confetti — sparkle cascade
    const playConfetti = useCallback(() => {
        const notes = [1047, 1175, 1319, 1397, 1568, 1760, 2093];
        notes.forEach((freq, i) => {
            playTone(freq, 0.1, 'sine', 0.15, i * 0.06);
        });
        // Final shimmer
        playTone(2093, 0.4, 'triangle', 0.2, 0.45);
    }, []);

    // ⏰ Timer tick — short beep (last 5 seconds)
    const playTimerTick = useCallback(() => {
        playTone(800, 0.08, 'square', 0.12, 0);
    }, []);

    // 🔚 Round End — descending tone
    const playRoundEnd = useCallback(() => {
        playTone(660, 0.2, 'sine', 0.2, 0);
        playTone(520, 0.2, 'sine', 0.2, 0.15);
        playTone(440, 0.35, 'sine', 0.25, 0.3);
    }, []);

    return { playGameStart, playCorrectGuess, playConfetti, playTimerTick, playRoundEnd };
}
