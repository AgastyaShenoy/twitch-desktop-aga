import { useState } from 'react';
import './Sidebar.css';
import { searchChannels } from '../api/twitch';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function Sidebar({ follows, streamData, onAddFollow, onRemoveFollow, onReorderFollows, onOpenSettings }) {
    const [q, setQ] = useState('');
    const [results, setResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        const val = e.target.value;
        setQ(val);
        if (val.length > 2) {
            setIsSearching(true);
            const res = await searchChannels(val);
            setResults(res || []);
            setIsSearching(false);
        } else {
            setResults([]);
        }
    };

    const handleAdd = (login) => {
        onAddFollow(login);
        setQ('');
        setResults([]);
    };

    const onDragEnd = (result) => {
        if (!result.destination) return;

        const items = Array.from(follows);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);

        onReorderFollows(items);
    };

    return (
        <aside className="sidebar">
            <h2 className="sidebar-title">Follows</h2>

            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search to Follow..."
                    value={q}
                    onChange={handleSearch}
                    className="search-input"
                />
                {results.length > 0 && (
                    <ul className="autocomplete">
                        {results.map(r => (
                            <li key={r.login} onClick={() => handleAdd(r.login)}>
                                <img src={r.profileImageURL} alt={r.displayName} />
                                <span>{r.displayName}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="follows-list">
                    {(provided) => (
                        <ul
                            className="follows-list"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {follows.map((f, index) => {
                                const isLive = streamData[f]?.live;
                                return (
                                    <Draggable key={f} draggableId={f} index={index}>
                                        {(provided, snapshot) => (
                                            <li
                                                className={`follow-item ${snapshot.isDragging ? 'dragging' : ''}`}
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                            >
                                                <div className="follow-info">
                                                    {isLive && <span className="live-dot" />}
                                                    <span className={isLive ? 'name-live' : 'name-offline'}>{f}</span>
                                                </div>
                                                <button className="del-btn" onMouseDown={(e) => e.stopPropagation()} onClick={() => onRemoveFollow(f)}>✕</button>
                                            </li>
                                        )}
                                    </Draggable>
                                );
                            })}
                            {provided.placeholder}
                        </ul>
                    )}
                </Droppable>
            </DragDropContext>
            <div className="sidebar-footer">
                <button className="settings-btn" onClick={onOpenSettings}>
                    ⚙️ Settings
                </button>
            </div>
        </aside>
    );
}
