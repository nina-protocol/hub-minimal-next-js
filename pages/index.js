import { useEffect, useState, useRef, useMemo } from 'react'
import NinaSdk from '@nina-protocol/js-sdk'

export default function Home() {
  const [hubData, setHubData] = useState(null)
  const [track, setTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [trackProgress, setTrackProgress] = useState(0)
  const [toggledIds, setToggledIds] = useState([])

  const playerRef = useRef()
  const activeIndexRef = useRef(0)
  const intervalRef = useRef()

  useEffect(() => {
    const loadHub = async () => {
      await NinaSdk.client.init(
        process.env.NINA_API_ENDPOINT,
        process.env.SOLANA_CLUSTER_URL,
        process.env.NINA_PROGRAM_ID
      )      
      const hub = await NinaSdk.Hub.fetch(process.env.NINA_HUB_ID, true)
      setHubData(hub)
      playerRef.current = document.querySelector('#audio')
    }

    loadHub()
    
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [])

  const trackSelected = (event, release, index) => {
    event.preventDefault()
    activeIndexRef.current = index
    if (track === release.metadata.animation_url) {
      if (isPlaying) {
        playerRef.current.pause()
        setIsPlaying(false)
      } else {
        setTrackProgress(0)
        setDuration(0)
        playerRef.current.play()
        setIsPlaying(true)
        startTimer()
      }
    } else {
      setTrackProgress(0)
      setDuration(0)
      playerRef.current.src = release.metadata.animation_url
      setTrack(release.metadata.animation_url)
      setIsPlaying(true)
      startTimer()
      playerRef.current.play()
    }
  }

  const startTimer = () => {
    // Clear any timers already running
    clearInterval(intervalRef.current)
    intervalRef.current = setInterval(() => {
      if (
        playerRef.current.currentTime > 0 &&
        playerRef.current.currentTime < playerRef.current.duration &&
        !playerRef.current.paused
      ) {
        setDuration(playerRef.current.duration)
        setTrackProgress(Math.ceil(playerRef.current.currentTime))
      } else if (playerRef.current.currentTime >= playerRef.current.duration) {
        next()
      }
    }, [300])
  }

  const hasNext = useMemo(
    () => activeIndexRef.current + 1 < hubData?.releases.length,
    [activeIndexRef.current]
  )

  const next = () => {
    if (hasNext) {
      setTrackProgress(0)
      activeIndexRef.current = activeIndexRef.current + 1
      playerRef.current.src = hubData.releases[activeIndexRef.current].metadata.animation_url
      setTrack(hubData.releases[activeIndexRef.current].metadata.animation_url)
      playerRef.current.play()
      startTimer()
    } else {
      // This means we've reached the end of the playlist
      setIsPlaying(false)
      setTrackProgress(0)
    }
  }
  const toggle = (e, i) => {
    e.preventDefault()
    e.stopPropagation()

    if (toggledIds.includes(i)) {
      setToggledIds(toggledIds.filter((id) => id !== i))
    } else {
      setToggledIds([...toggledIds, i])
    }
  }

  if (!hubData) {
    return <p className='mt-2 ml-2 font-mono text-sm'>Loading...</p>
  }
  return (
    <div className='font-mono text-sm max-w-lg'>
      <p className='mt-2 ml-2'>{hubData.hub.data.displayName}</p>
      <p className='mt-2 ml-2 mb-6'>{hubData.hub.data.description}</p>
      {hubData.releases.sort((a,b) => b.accountData.hubContent.datetime - a.accountData.hubContent.datetime).map((release, i) => (
        <>
          <p className={`ml-2 ${activeIndexRef.current === i ? 'font-bold' : ''}`}>
            <span 
              className='cursor-pointer'
              onClick={(e) => toggle(e, i)}
            >
              {toggledIds.includes(i) ? `[-] ` : `[+] `}
            </span>
            <span 
              className='cursor-pointer'
              onClick={(e) => trackSelected(e, release, i)}
            >
              {activeIndexRef.current === i && (isPlaying ? <span>[Now Playing - {Math.round((trackProgress / duration) * 100) || 0}%] </span> : <span>[Paused] </span>)}
              {process.env.SHOW_ARTIST_NAME && (`${release.metadata.properties.artist} - `)}{release.metadata.properties.title}
            </span>
          </p>
          {toggledIds.includes(i) && (
            <div className='ml-2 mb-4 mt-2'>
              <img src={release.metadata.image} />
              <p className='mt-2'>{release.metadata.descriptionHtml}</p>
              <p className='mt-2'>
                <span>{release.accountData.release.remainingSupply} / {release.accountData.release.totalSupply} Remaining |</span> 
                <span> {release.accountData.release.price / 1000000} USDC</span>
              </p>
            </div>
          )}
        </>
      ))}
      <audio id="audio" style={{ width: '100%' }}>
        <source src={track} type="audio/mp3" />
      </audio>
    </div>
  )
}
