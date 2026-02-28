import './StreamGrid.css';

export default function StreamGrid({ streamData, onPlay }) {
    const streamers = Object.keys(streamData);

    if (streamers.length === 0) {
        return <div className="empty-state">Search and add a streamer to get started!</div>;
    }

    let hasContent = false;

    return (
        <div className="stream-grid-container">
            {streamers.map(s => {
                const live = streamData[s]?.live;
                const vods = streamData[s]?.vods || [];

                if (!live && vods.length === 0) return null;
                hasContent = true;

                return (
                    <div key={s} className="streamer-section">
                        <h3 className="streamer-name">{s}</h3>
                        <div className="cards-scroll">
                            {live && (
                                <div className="card" onClick={() => onPlay(s, true)}>
                                    <div className="thumb-container">
                                        <img src={live.stream.previewImageURL} alt={live.stream.title} />
                                        <span className="live-badge">LIVE</span>
                                    </div>
                                    <div className="card-info">
                                        <span className="card-title">{live.stream.title}</span>
                                        <span className="card-game">{live.stream.game?.name}</span>
                                    </div>
                                </div>
                            )}
                            {vods.map(vod => (
                                <div key={vod.id} className="card" onClick={() => onPlay(s, false, vod.id)}>
                                    <div className="thumb-container">
                                        <img src={vod.previewThumbnailURL} alt={vod.title} />
                                        <span className="vod-badge">{formatDuration(vod.lengthSeconds)}</span>
                                    </div>
                                    <div className="card-info">
                                        <span className="card-title">{vod.title}</span>
                                        <span className="card-time">{new Date(vod.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })}

            {!hasContent && <div className="empty-state">No live streams or recent VODs found.</div>}
        </div>
    );
}

function formatDuration(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

function pad(n) {
    return n < 10 ? '0' + n : n;
}
