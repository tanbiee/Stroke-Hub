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
        try {
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
        } catch (e) {
            // Silently ignore audio errors
        }
    };

    // Helper: play noise burst (for confetti pop)
    const playNoise = (duration = 0.1, volume = 0.08, delay = 0) => {
        try {
            const ctx = getCtx();
            const bufferSize = ctx.sampleRate * duration;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
            noise.connect(gain);
            gain.connect(ctx.destination);
            noise.start(ctx.currentTime + delay);
        } catch (e) {
            // Silently ignore
        }
    };

    // 🎮 Game Start — bright ascending fanfare
    const playGameStart = useCallback(() => {
        playTone(523, 0.12, 'sine', 0.25, 0);       // C5
        playTone(659, 0.12, 'sine', 0.25, 0.1);     // E5
        playTone(784, 0.12, 'sine', 0.25, 0.2);     // G5
        playTone(1047, 0.35, 'sine', 0.35, 0.3);    // C6 hold
        playTone(1319, 0.2, 'triangle', 0.15, 0.5); // E6 sparkle
    }, []);

    // ✅ Correct Guess — cheerful ding-ding
    const playCorrectGuess = useCallback(() => {
        playTone(880, 0.1, 'sine', 0.3, 0);         // A5
        playTone(1175, 0.12, 'sine', 0.3, 0.08);    // D6
        playTone(1397, 0.2, 'triangle', 0.25, 0.16); // F6
        playNoise(0.05, 0.06, 0.2);                   // pop
    }, []);

    // 🎊 Confetti — sparkle cascade with pop
    const playConfetti = useCallback(() => {
        playNoise(0.08, 0.1, 0);  // initial pop
        const notes = [1047, 1175, 1319, 1397, 1568, 1760, 2093];
        notes.forEach((freq, i) => {
            playTone(freq, 0.08, 'sine', 0.12, 0.05 + i * 0.05);
        });
        // Final shimmer chord
        playTone(2093, 0.5, 'triangle', 0.15, 0.42);
        playTone(2637, 0.5, 'triangle', 0.1, 0.42);
    }, []);

    // ⏰ Timer tick — urgent beep (last 5 seconds)
    const playTimerTick = useCallback(() => {
        playTone(800, 0.06, 'square', 0.15, 0);
        playTone(800, 0.06, 'square', 0.1, 0.08);
    }, []);

    // 🔚 Round End — descending "time's up" jingle
    const playRoundEnd = useCallback(() => {
        playTone(784, 0.15, 'sine', 0.2, 0);       // G5
        playTone(660, 0.15, 'sine', 0.2, 0.12);    // E5
        playTone(523, 0.15, 'sine', 0.2, 0.24);    // C5
        playTone(392, 0.4, 'sine', 0.25, 0.36);    // G4 hold
    }, []);

    // 🏆 Game Over / Winner — triumphant fanfare
    const playGameOver = useCallback(() => {
        playTone(523, 0.12, 'sine', 0.25, 0);
        playTone(659, 0.12, 'sine', 0.25, 0.1);
        playTone(784, 0.12, 'sine', 0.25, 0.2);
        playTone(1047, 0.3, 'sine', 0.3, 0.3);
        playNoise(0.1, 0.08, 0.3);
        playTone(1319, 0.15, 'triangle', 0.2, 0.5);
        playTone(1568, 0.15, 'triangle', 0.2, 0.6);
        playTone(2093, 0.5, 'sine', 0.25, 0.7);
    }, []);

    // 🔔 Player Join — short welcoming ping
    const playPlayerJoin = useCallback(() => {
        playTone(698, 0.1, 'sine', 0.15, 0);
        playTone(880, 0.15, 'sine', 0.18, 0.08);
    }, []);

    // ✏️ Your Turn — notification that you're drawing
    const playYourTurn = useCallback(() => {
        playTone(587, 0.1, 'sine', 0.2, 0);
        playTone(784, 0.1, 'sine', 0.2, 0.1);
        playTone(988, 0.2, 'triangle', 0.25, 0.2);
    }, []);

    return {
        playGameStart,
        playCorrectGuess,
        playConfetti,
        playTimerTick,
        playRoundEnd,
        playGameOver,
        playPlayerJoin,
        playYourTurn,
    };
}
