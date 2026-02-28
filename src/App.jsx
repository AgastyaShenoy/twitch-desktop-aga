import './App.css'
import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import StreamGrid from './components/StreamGrid'
import TwitchPlayer from './components/TwitchPlayer'
import { getLiveStreams, getRecentVods } from './api/twitch'
import Toast from './components/Toast'
import SettingsModal from './components/SettingsModal'

function App() {
  const [follows, setFollows] = useState([])
  const [streamData, setStreamData] = useState({})
  const [activeStream, setActiveStream] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    return parseInt(localStorage.getItem('sidebarWidth')) || 280
  })
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    // Apply saved theme
    const savedTheme = localStorage.getItem('themeColor') || 'brand-purple'
    document.documentElement.className = savedTheme

    // Load follows from Electron IPC
    if (window.electronAPI) {
      window.electronAPI.readFollows().then(data => {
        setFollows(data || [])
      })
    }
  }, [])

  useEffect(() => {
    if (follows.length > 0) {
      refreshData(follows)
    } else {
      setStreamData({})
    }
  }, [follows])

  const refreshData = async (users) => {
    const live = await getLiveStreams(users)
    const liveMap = live.reduce((acc, user) => {
      acc[user.login] = user
      return acc
    }, {})

    const newData = {}
    for (const user of users) {
      const vods = await getRecentVods(user, 5)
      newData[user] = {
        live: liveMap[user] || null,
        vods: vods || []
      }
    }
    setStreamData(newData)
  }

  const handleAddFollow = async (username) => {
    if (!username) return;
    const lower = username.toLowerCase()
    if (!follows.includes(lower)) {
      const updated = [...follows, lower]
      setFollows(updated)
      if (window.electronAPI) window.electronAPI.saveFollows(updated)
      showToast(`Added ${username} to follows!`)
    } else {
      showToast(`${username} is already followed.`)
    }
  }

  const handleRemoveFollow = async (username) => {
    const updated = follows.filter(f => f !== username)
    setFollows(updated)
    if (window.electronAPI) window.electronAPI.saveFollows(updated)
    showToast(`Removed ${username} from follows.`)
  }

  const handleReorderFollows = (newOrder) => {
    setFollows(newOrder)
    if (window.electronAPI) window.electronAPI.saveFollows(newOrder)
  }

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const playStream = (channel, isLive, videoId = null) => {
    setActiveStream({ channel, isLive, videoId })
  }

  const closePlayer = () => {
    setActiveStream(null)
  }

  // Handle Resize logic via global window events to avoid stutter when dragging fast
  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e) => {
      // Add minimum width constraints (e.g., 200px to 600px)
      let newWidth = e.clientX
      if (newWidth < 200) newWidth = 200
      if (newWidth > 600) newWidth = 600
      setSidebarWidth(newWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      localStorage.setItem('sidebarWidth', sidebarWidth.toString())
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, sidebarWidth])

  const startResizing = (e) => {
    e.preventDefault()
    setIsResizing(true)
  }

  return (
    <div className={`app-container ${isResizing ? 'resizing' : ''}`}>
      {!activeStream && (
        <div className="sidebar-container" style={{ width: sidebarWidth }}>
          <Sidebar
            follows={follows}
            streamData={streamData}
            onAddFollow={handleAddFollow}
            onRemoveFollow={handleRemoveFollow}
            onReorderFollows={handleReorderFollows}
            onOpenSettings={() => setShowSettings(true)}
          />
          <div className="sidebar-resizer" onMouseDown={startResizing} />
        </div>
      )}

      {!activeStream ? (
        <main className="main-content">
          <header className="main-header">
            <h1>Your Followed Streams</h1>
          </header>
          <div className="content-scroll">
            <StreamGrid streamData={streamData} onPlay={playStream} />
          </div>
        </main>
      ) : (
        <TwitchPlayer stream={activeStream} onClose={closePlayer} />
      )}

      {toastMessage && <Toast message={toastMessage} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
