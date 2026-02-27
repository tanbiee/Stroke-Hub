import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebRTC(socket, roomId, user, isConnected, users) {
    const [isMicOn, setIsMicOn] = useState(false);
    const [speakingUsers, setSpeakingUsers] = useState(new Set()); // IDs of users currently producing volume

    const localStreamRef = useRef(null);
    const peersRef = useRef({}); // { [userId]: RTCPeerConnection }
    const audioElementsRef = useRef(new Map()); // { [userId]: HTMLAudioElement }
    const audioContextRef = useRef(null);
    const analyzerRefs = useRef({}); // { [userId]: AnalyserNode }
    const speakingIntervalRef = useRef(null);
    const micInitializedRef = useRef(false);

    const ICE_SERVERS = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
    ];

    // 1. Initialize local microphone (muted by default)
    const startMicrophone = async () => {
        if (micInitializedRef.current && localStreamRef.current) return true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            localStreamRef.current = stream;
            micInitializedRef.current = true;

            // Start muted by default
            stream.getAudioTracks().forEach(track => {
                track.enabled = false;
            });
            setIsMicOn(false);

            setupSpeakingDetection();

            // Add tracks to any existing peers that don't have local tracks
            Object.entries(peersRef.current).forEach(([userId, peer]) => {
                const senders = peer.getSenders();
                if (senders.length === 0 || !senders.find(s => s.track)) {
                    stream.getTracks().forEach(track => {
                        peer.addTrack(track, stream);
                    });
                }
            });

            return true;
        } catch (err) {
            console.error("Error accessing microphone:", err);
            return false;
        }
    };

    // 2. Toggle Mic Mute
    const toggleMic = useCallback(() => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMicOn(audioTrack.enabled);
            }
        } else {
            // First time clicking mic — initialize and enable
            startMicrophone().then(success => {
                if (success && localStreamRef.current) {
                    const audioTrack = localStreamRef.current.getAudioTracks()[0];
                    if (audioTrack) {
                        audioTrack.enabled = true;
                        setIsMicOn(true);
                    }
                    // After getting mic, connect to all existing users
                    connectToExistingUsers();
                }
            });
        }
    }, [roomId, socket, isConnected, users]);

    // 3. Connect to all existing users in the room
    const connectToExistingUsers = useCallback(() => {
        if (!users || !user) return;
        users.forEach(u => {
            if (u.userId !== user.id && !peersRef.current[u.userId]) {
                createPeer(u.userId, true);
            }
        });
    }, [users, user]);

    // Auto-initialize microphone on mount (muted) so tracks are ready
    useEffect(() => {
        if (isConnected && !micInitializedRef.current) {
            startMicrophone();
        }
    }, [isConnected]);

    // 4. Create a new RTCPeerConnection
    const createPeer = useCallback((targetUserId, initiator) => {
        if (!socket) return null;

        // If peer already exists and is connected/connecting, reuse it
        if (peersRef.current[targetUserId]) {
            const state = peersRef.current[targetUserId].connectionState;
            if (state === 'connected' || state === 'connecting') {
                return peersRef.current[targetUserId];
            }
            // Cleanup stale peer
            peersRef.current[targetUserId].close();
            delete peersRef.current[targetUserId];
        }

        const peer = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        // Add local stream if we have one
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => {
                peer.addTrack(track, localStreamRef.current);
            });
        }

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('webrtc-ice-candidate', {
                    targetUserId,
                    candidate: event.candidate
                });
            }
        };

        // Handle receiving remote audio
        peer.ontrack = (event) => {
            const [remoteStream] = event.streams;

            // Create or update audio element
            let audio = audioElementsRef.current.get(targetUserId);
            if (!audio) {
                audio = new Audio();
                audio.autoplay = true;
                audioElementsRef.current.set(targetUserId, audio);
            }

            audio.srcObject = remoteStream;

            // Explicitly play with autoplay policy handling
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(err => {
                    console.warn("Audio autoplay blocked for", targetUserId, "- will retry on user interaction");
                    // Retry on next user interaction
                    const retryPlay = () => {
                        audio.play().catch(() => { });
                        document.removeEventListener('click', retryPlay);
                        document.removeEventListener('keydown', retryPlay);
                    };
                    document.addEventListener('click', retryPlay, { once: true });
                    document.addEventListener('keydown', retryPlay, { once: true });
                });
            }

            // Connect to analyzer for speaking detection
            setupRemoteAnalyzer(targetUserId, remoteStream);
        };

        // Handle connection state changes
        peer.onconnectionstatechange = () => {
            if (peer.connectionState === 'failed' || peer.connectionState === 'disconnected') {
                console.warn(`Peer ${targetUserId} connection ${peer.connectionState}, will cleanup`);
            }
        };

        // Initiator specific logic (Send Offer)
        if (initiator) {
            peer.createOffer()
                .then(offer => peer.setLocalDescription(offer))
                .then(() => {
                    socket.emit('webrtc-offer', {
                        targetUserId,
                        offer: peer.localDescription
                    });
                })
                .catch(err => console.error("Error creating offer:", err));
        }

        peersRef.current[targetUserId] = peer;
        return peer;
    }, [socket]);

    // 5. Setup Speaking Detection (Volume Meters)
    const setupRemoteAnalyzer = (userId, stream) => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }

        // Resume audio context if suspended
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }

        try {
            const src = audioContextRef.current.createMediaStreamSource(stream);
            const analyzer = audioContextRef.current.createAnalyser();
            analyzer.fftSize = 256;
            src.connect(analyzer);
            analyzerRefs.current[userId] = analyzer;
        } catch (err) {
            console.error("Error setting up analyzer:", err);
        }
    };

    const setupSpeakingDetection = () => {
        if (speakingIntervalRef.current) return;

        speakingIntervalRef.current = setInterval(() => {
            const newSpeaking = new Set();

            // Check all remote users
            Object.entries(analyzerRefs.current).forEach(([userId, analyzer]) => {
                if (userId === 'local') return; // Handle local separately
                const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                analyzer.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = sum / dataArray.length;

                // Threshold for speaking
                if (average > 10) {
                    newSpeaking.add(userId);
                }
            });

            // Check local user (are WE speaking?)
            if (isMicOn && localStreamRef.current) {
                if (!analyzerRefs.current['local']) {
                    setupRemoteAnalyzer('local', localStreamRef.current);
                } else {
                    const analyzer = analyzerRefs.current['local'];
                    const dataArray = new Uint8Array(analyzer.frequencyBinCount);
                    analyzer.getByteFrequencyData(dataArray);

                    let sum = 0;
                    for (let i = 0; i < dataArray.length; i++) {
                        sum += dataArray[i];
                    }
                    const average = sum / dataArray.length;

                    if (average > 10) {
                        newSpeaking.add(user?.id);
                    }
                }
            }

            setSpeakingUsers(prev => {
                // Only update state if sets are different to prevent infinite re-renders
                if (prev.size !== newSpeaking.size) return newSpeaking;
                let different = false;
                for (let elem of newSpeaking) {
                    if (!prev.has(elem)) different = true;
                }
                return different ? newSpeaking : prev;
            });
        }, 200); // Check every 200ms
    };

    // 6. Socket Listeners for Signaling
    useEffect(() => {
        if (!socket || !isConnected) return;

        const handleUserJoined = ({ userId }) => {
            // New user joined, WE start the WebRTC connection process as the initiator
            if (userId !== user?.id) {
                createPeer(userId, true);
            }
        };

        const handleUserLeft = ({ userId }) => {
            if (peersRef.current[userId]) {
                peersRef.current[userId].close();
                delete peersRef.current[userId];
            }
            if (audioElementsRef.current.has(userId)) {
                const audio = audioElementsRef.current.get(userId);
                audio.srcObject = null;
                audio.remove();
                audioElementsRef.current.delete(userId);
            }
            if (analyzerRefs.current[userId]) {
                delete analyzerRefs.current[userId];
            }
        };

        const handleOffer = async ({ senderId, offer }) => {
            // When receiving an offer, always create a fresh peer (non-initiator)
            // Clean up any existing peer first
            if (peersRef.current[senderId]) {
                peersRef.current[senderId].close();
                delete peersRef.current[senderId];
            }

            const peer = createPeer(senderId, false);
            if (!peer) return;

            try {
                await peer.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await peer.createAnswer();
                await peer.setLocalDescription(answer);
                socket.emit('webrtc-answer', {
                    targetUserId: senderId,
                    answer: peer.localDescription
                });
            } catch (err) {
                console.error("Error handling offer:", err);
            }
        };

        const handleAnswer = async ({ senderId, answer }) => {
            const peer = peersRef.current[senderId];
            if (peer) {
                try {
                    await peer.setRemoteDescription(new RTCSessionDescription(answer));
                } catch (err) {
                    console.error("Error handling answer:", err);
                }
            }
        };

        const handleCandidate = async ({ senderId, candidate }) => {
            const peer = peersRef.current[senderId];
            if (peer) {
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                } catch (err) {
                    console.error("Error adding ice candidate:", err);
                }
            }
        };

        socket.on('user-joined', handleUserJoined);
        socket.on('user-left', handleUserLeft);
        socket.on('webrtc-offer', handleOffer);
        socket.on('webrtc-answer', handleAnswer);
        socket.on('webrtc-ice-candidate', handleCandidate);

        return () => {
            socket.off('user-joined', handleUserJoined);
            socket.off('user-left', handleUserLeft);
            socket.off('webrtc-offer', handleOffer);
            socket.off('webrtc-answer', handleAnswer);
            socket.off('webrtc-ice-candidate', handleCandidate);
        };
    }, [socket, isConnected, createPeer, user]);

    // 7. When users list changes, try to connect to any users we don't have peers for
    useEffect(() => {
        if (!socket || !isConnected || !user) return;

        users.forEach(u => {
            if (u.userId !== user.id && !peersRef.current[u.userId]) {
                createPeer(u.userId, true);
            }
        });
    }, [users, socket, isConnected, user, createPeer]);

    // 8. Global Cleanup
    useEffect(() => {
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
            }
            Object.values(peersRef.current).forEach(peer => peer.close());
            audioElementsRef.current.forEach(audio => {
                audio.srcObject = null;
                audio.remove();
            });
            if (speakingIntervalRef.current) {
                clearInterval(speakingIntervalRef.current);
            }
            if (audioContextRef.current) {
                audioContextRef.current.close().catch(() => { });
            }
        };
    }, []);

    return { isMicOn, toggleMic, speakingUsers };
}
