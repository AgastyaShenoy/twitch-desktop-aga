import { useState, useEffect, useRef } from 'react';
import './TwitchPlayer.css';

export default function TwitchPlayer({ stream, onClose }) {
    const [chatVisible, setChatVisible] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(false);
    const [savedTime, setSavedTime] = useState(0);

    const playerRef = useRef(null);
    const progressIntervalRef = useRef(null);
    const parentParam = 'localhost';

    // Initial check for saved VOD progress
    useEffect(() => {
        if (!stream.isLive && stream.videoId) {
            const storageKey = `vod_progress_${stream.videoId}`;
            const lastTime = parseFloat(localStorage.getItem(storageKey) || '0');
            if (lastTime > 30) {
                setSavedTime(lastTime);
                setShowResumePrompt(true);
            }
        }
    }, [stream]);

    useEffect(() => {
        const webview = playerRef.current;
        if (!webview) return;

        const handleLoad = () => {
            const css = `
                .player-overlay-info,
                [data-a-target="player-overlay-channel-info"],
                [data-a-target="video-info-overlay"],
                [data-test-selector="stream-info-card-component"],
                [data-a-target="player-overlay-follow-button"],
                [data-a-target="player-overlay-subscribe-button"],
                .player-overlay-background {
                    display: none !important;
                    opacity: 0 !important;
                    visibility: hidden !important;
                    pointer-events: none !important;
                }
            `;

            try {
                if (typeof webview.insertCSS !== 'function') {
                    window.electronAPI.log('ERROR: webview.insertCSS is not a function - Context Isolation is stripping it!');
                } else {
                    window.electronAPI.log('SUCCESS: webview.insertCSS is available!');
                    webview.insertCSS(css).catch(e => window.electronAPI.log('CSS Inject Error:', e.message));
                }

                if (typeof webview.executeJavaScript === 'function') {
                    window.electronAPI.log('SUCCESS: webview.executeJavaScript is available!');
                    webview.executeJavaScript(`
                        (function() {
                            const style = document.createElement('style');
                            style.innerHTML = \`${css}\`;
                            document.head.appendChild(style);
                            
                            setInterval(() => {
                                const buttons = document.querySelectorAll('button, a, [role="button"]');
                                buttons.forEach(btn => {
                                    const text = btn.innerText || '';
                                    if (text.includes('Follow') || text.includes('Subscribe')) {
                                        btn.style.setProperty('display', 'none', 'important');
                                    }
                                });
                                const channelInfo = document.querySelector('[data-a-target="player-overlay-channel-info"], .player-overlay-info');
                                if(channelInfo) channelInfo.style.setProperty('display', 'none', 'important');
                            }, 1000);
                        })();
                    `).catch(e => window.electronAPI.log('JS Inject Error:', e.message));
                }
            } catch (err) {
                window.electronAPI.log("Webview setup error:", err.message);
            }
        };

        const saveProgress = () => {
            if (!stream.isLive && stream.videoId) {
                const storageKey = `vod_progress_${stream.videoId}`;
                if (webview && typeof webview.executeJavaScript === 'function') {
                    webview.executeJavaScript(`
                        (function() {
                            const v = document.querySelector('video');
                            return v ? v.currentTime : 0;
                        })();
                    `).then(current => {
                        if (current > 0) {
                            localStorage.setItem(storageKey, current.toString());
                        }
                    }).catch(() => { });
                }
            }
        };

        webview.addEventListener('dom-ready', handleLoad);
        webview.addEventListener('did-finish-load', handleLoad);

        // VOD Progress Saving
        if (!stream.isLive && stream.videoId) {
            progressIntervalRef.current = setInterval(saveProgress, 5000);
        }

        return () => {
            webview.removeEventListener('dom-ready', handleLoad);
            webview.removeEventListener('did-finish-load', handleLoad);
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        };
    }, [stream]);

    const handleResume = (resume) => {
        setShowResumePrompt(false);
        if (resume && playerRef.current && typeof playerRef.current.executeJavaScript === 'function') {
            playerRef.current.executeJavaScript(`
                (function() {
                    const v = document.querySelector('video');
                    if (v) v.currentTime = ${savedTime};
                })();
            `);
        }
    };

    const videoSrc = stream.isLive
        ? `https://player.twitch.tv/?channel=${stream.channel}&parent=${parentParam}&autoplay=true`
        : `https://player.twitch.tv/?video=${stream.videoId}&parent=${parentParam}&autoplay=true`;

    return (
        <div className="player-wrapper">
            <div className="player-overlay-controls">
                <button className="overlay-btn" onClick={onClose}>
                    &lt; Back to Browse
                </button>

                {stream.channel && (
                    <button className="overlay-btn chat-toggle" onClick={() => setChatVisible(!chatVisible)}>
                        Toggle Chat
                    </button>
                )}
            </div>

            {showResumePrompt && (
                <div className="resume-prompt-overlay">
                    <div className="resume-prompt">
                        <p>Resume from {formatTime(savedTime)}?</p>
                        <div className="prompt-actions">
                            <button onClick={() => handleResume(true)}>Yes</button>
                            <button onClick={() => handleResume(false)}>No, Start Over</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="video-section" style={{ position: 'relative' }}>
                <webview
                    ref={playerRef}
                    src={videoSrc}
                    style={{ width: '100%', height: '100%' }}
                    allowpopups="true"
                />
            </div>

            {chatVisible && stream.channel && (
                <div className="chat-section">
                    <iframe
                        src={stream.isLive
                            ? `https://www.twitch.tv/embed/${stream.channel}/chat?parent=${parentParam}&darkpopout`
                            : `https://www.twitch.tv/embed/${stream.channel}/chat?parent=${parentParam}&video=${stream.videoId}&darkpopout`
                        }
                        height="100%"
                        width="100%"
                        frameBorder="0"
                        title="Twitch Chat"
                    />
                </div>
            )}
        </div>
    );
}

function formatTime(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const p = (n) => n < 10 ? '0' + n : n;
    return h > 0 ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}
