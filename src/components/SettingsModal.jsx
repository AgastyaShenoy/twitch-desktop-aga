import { useState, useEffect } from 'react';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
    const [theme, setTheme] = useState(localStorage.getItem('themeColor') || 'brand-purple');
    const [volume, setVolume] = useState(parseFloat(localStorage.getItem('defaultVolume') || '0.5'));
    const [quality, setQuality] = useState(localStorage.getItem('defaultQuality') || 'auto');

    // Auto-Updater State
    const [appVersion, setAppVersion] = useState('');
    const [updateStatus, setUpdateStatus] = useState(''); // 'checking', 'available', 'not-available', 'downloading', 'downloaded', 'error'
    const [downloadProgress, setDownloadProgress] = useState(null);

    useEffect(() => {
        // Apply theme immediately to root Document for instant feedback
        document.documentElement.className = theme;
    }, [theme]);

    useEffect(() => {
        let cleanup;
        if (window.electronAPI && window.electronAPI.getAppVersion) {
            window.electronAPI.getAppVersion().then(version => setAppVersion(version));

            cleanup = window.electronAPI.onUpdaterEvent((status, info) => {
                setUpdateStatus(status);
                if (status === 'progress') {
                    setDownloadProgress(info);
                }
            });
        }
        return () => {
            if (cleanup) cleanup();
        };
    }, []);

    const handleSave = () => {
        localStorage.setItem('themeColor', theme);
        localStorage.setItem('defaultVolume', volume.toString());
        localStorage.setItem('defaultQuality', quality);
        onClose();
    };

    const handleCheckUpdate = () => {
        setUpdateStatus('checking');
        if (window.electronAPI && window.electronAPI.checkForUpdates) {
            window.electronAPI.checkForUpdates();
        }
    };

    const handleInstallUpdate = () => {
        if (window.electronAPI && window.electronAPI.installUpdate) {
            window.electronAPI.installUpdate();
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>App Settings</h2>

                <div className="setting-group">
                    <label>Theme Color</label>
                    <div className="theme-options">
                        <button
                            className={`theme-btn purple ${theme === 'brand-purple' ? 'active' : ''}`}
                            onClick={() => setTheme('brand-purple')}
                        />
                        <button
                            className={`theme-btn blue ${theme === 'brand-blue' ? 'active' : ''}`}
                            onClick={() => setTheme('brand-blue')}
                        />
                        <button
                            className={`theme-btn green ${theme === 'brand-green' ? 'active' : ''}`}
                            onClick={() => setTheme('brand-green')}
                        />
                        <button
                            className={`theme-btn red ${theme === 'brand-red' ? 'active' : ''}`}
                            onClick={() => setTheme('brand-red')}
                        />
                    </div>
                </div>

                <div className="setting-group">
                    <label>Default Player Volume</label>
                    <div className="volume-slider">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                        />
                        <span>{Math.round(volume * 100)}%</span>
                    </div>
                </div>

                <div className="setting-group">
                    <label>Default Player Quality</label>
                    <select value={quality} onChange={(e) => setQuality(e.target.value)}>
                        <option value="auto">Auto</option>
                        <option value="1080p60">Sample (1080p60)</option>
                        <option value="1080p">1080p</option>
                        <option value="720p60">720p60</option>
                        <option value="720p">720p</option>
                        <option value="480p">480p</option>
                        <option value="360p">360p</option>
                    </select>
                </div>

                <div className="setting-group updater-group">
                    <label>Application Version</label>
                    <div className="updater-info">
                        <p>v{appVersion}</p>
                        {updateStatus === '' || updateStatus === 'not-available' || updateStatus === 'error' ? (
                            <button className="btn-secondary" onClick={handleCheckUpdate}>
                                Check for Updates
                            </button>
                        ) : updateStatus === 'checking' ? (
                            <p className="status-text">Checking for updates...</p>
                        ) : updateStatus === 'available' ? (
                            <p className="status-text">Update found! Preparing to download...</p>
                        ) : updateStatus === 'progress' && downloadProgress ? (
                            <p className="status-text">Downloading: {Math.round(downloadProgress.percent)}%</p>
                        ) : updateStatus === 'downloaded' ? (
                            <button className="btn-primary highlight" onClick={handleInstallUpdate}>
                                Restart & Install Update
                            </button>
                        ) : null}
                    </div>
                    {updateStatus === 'error' && <p className="error-text">Failed to check for updates.</p>}
                    {updateStatus === 'not-available' && <p className="success-text">You are on the latest version.</p>}
                </div>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </div>
    );
}
