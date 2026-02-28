import { useState, useEffect } from 'react';
import './SettingsModal.css';

export default function SettingsModal({ onClose }) {
    const [theme, setTheme] = useState(localStorage.getItem('themeColor') || 'brand-purple');
    const [volume, setVolume] = useState(parseFloat(localStorage.getItem('defaultVolume') || '0.5'));
    const [quality, setQuality] = useState(localStorage.getItem('defaultQuality') || 'auto');

    useEffect(() => {
        // Apply theme immediately to root Document for instant feedback
        document.documentElement.className = theme;
    }, [theme]);

    const handleSave = () => {
        localStorage.setItem('themeColor', theme);
        localStorage.setItem('defaultVolume', volume.toString());
        localStorage.setItem('defaultQuality', quality);
        onClose();
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

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose}>Cancel</button>
                    <button className="btn-primary" onClick={handleSave}>Save Settings</button>
                </div>
            </div>
        </div>
    );
}
