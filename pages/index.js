import { useEffect, useState, useRef, useMemo } from 'react'
import NinaSdk from '@nina-protocol/js-sdk'
import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import {
  useWalletModal,
} from '@solana/wallet-adapter-react-ui';
import { useSnackbar } from 'react-simple-snackbar'

export default function Home() {
  const options = {
    position: 'bottom',
    style: {
      backgroundColor: '#2f3291',
      color: 'white',
      fontFamily: 'Space Grotesk, sans',
      fontSize: '20px',
      textAlign: 'center',
      cornerRadius: '0px',
    },
  }
  const wallet = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const [openSnackbar] = useSnackbar(options)
  const [hubData, setHubData] = useState(null)
  const [track, setTrack] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [trackProgress, setTrackProgress] = useState(0)
  const [toggledIds, setToggledIds] = useState([])
  const [releasePurchaseAfterConnection, setReleasePurchaseAfterConnection] = useState(undefined)
  const playerRef = useRef()
  const activeIndexRef = useRef(0)
  const intervalRef = useRef()

  
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

  useEffect(() => {
    loadHub()
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (wallet.publicKey && releasePurchaseAfterConnection) {
      handlePuchaseClick(undefined, releasePurchaseAfterConnection)
      setReleasePurchaseAfterConnection(undefined)
    }
  }, [wallet.publicKey, releasePurchaseAfterConnection])

  const trackSelected = (event, release, index) => {
    if (!playerRef.current) {
      playerRef.current = document.querySelector('#audio')
    }
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

  const seek = (e) => {
    const percent = e.nativeEvent.offsetX / e.currentTarget.offsetWidth
    playerRef.current.currentTime = percent * playerRef.current.duration
    setTrackProgress(Math.ceil(playerRef.current.currentTime))
  }

  const handlePuchaseClick = async (e, release) => {
    if (e) {
      e.preventDefault()
    }

    if (!wallet.publicKey) {
      setVisible(true)
      setReleasePurchaseAfterConnection(release)
      return
    }
    try {
      const success = await NinaSdk.Release.purchaseViaHub(release.publicKey, hubData.hub.publicKey, wallet, connection, NinaSdk.client.program)
      if (success) {
        await loadHub()
        openSnackbar(`${release.metadata.properties.artist} - ${release.metadata.properties.title} purchased.`)
      }
    } catch (error) {
      console.log(error)
    }
  }

  if (!hubData) {
    return <p className='mt-2 ml-2 font-sans text-sm text-[#2f3291]'>Loading...</p>
  }
  return (
    <div className='flex flex-col h-screen justify-between font-sans text-sm overflow-x-hidden text-[#2f3291]'>
      <div className='flex flex-col md:flex-row'>
        <div className='max-w-lg pb-10 sticky'>
          <div className='sticky top-2'>
            <p className='mt-2 ml-2'>29 Speedway: Channel Plus</p>
            <div className='m-2'>
              <img src='/images/channelplus.png' />
            </div>
            <p className='mt-2 ml-2 mb-6'>
              Simple tides pull away at the strings that control your sight<br />
              Anarchy is sound and sound is a fight<br />
              Drifting into the night a call awakens you<br />
              Algorithmic buzzing,<br />
              Who makes music in the sewers?<br />
              Must be the primordial ooze.<br />
            </p>
            <p className='mt-2 ml-2 mb-6 text-xs'>
              Artwork by Jota Pepsi<br />
              Mastered by Ben Shirken at 5950.exp in Ridegwood, NY <br />
            </p>
          </div>
          <audio id="audio" style={{ width: '100%' }}>
            <source src={track} type="audio/mp3" />
          </audio>
        </div>
        <div className='md:pt-10 pb-10 md:w-1/2 ms:max-w-lg'>
          {hubData.releases.sort((a,b) => b.accountData.hubContent.datetime - a.accountData.hubContent.datetime).map((release, i) => (
            <>
              <hr />
              <div className='w-full'>
                <p className={`ml-2 mr-2 z-100 ${activeIndexRef.current === i ? 'font-bold' : ''} ${toggledIds.includes(i) ? '' : 'truncate'}`}>
                  <span 
                    className='cursor-pointer'
                    onClick={(e) => toggle(e, i)}
                  >
                    {toggledIds.includes(i) ? `[-] ` : `[+] `}
                  </span>
                  <span 
                    className='cursor-pointer text-ellipsis'
                    onClick={(e) => trackSelected(e, release, i)}
                  >
                    {process.env.SHOW_ARTIST_NAME && (`${release.metadata.properties.artist} - `)}{release.metadata.properties.title}
                  </span>
                </p>
              </div>
              {toggledIds.includes(i) && (
                <div className='m-2'>
                  {/* <img src={release.metadata.image} /> */}
                  <p className='mt-2'>{release.metadata.description}</p>
                  <p className='mt-2'>
                    <span>{release.accountData.release.remainingSupply} / {release.accountData.release.totalSupply} Remaining</span> 
                  </p>
                  <p className='mt-2'>
                    <span><button className="border border-[#2f3291] p-2" onClick={(e) => handlePuchaseClick(e, release)}> Purchase ({release.accountData.release.price / 1000000} USDC)</button></span>
                  </p>
                </div>
              )}
            </>
          ))}
      </div>

      </div>
      <footer className='h-10 fixed bottom-0 w-full'>
        <div className='bg-white h-full border-2 border-[#2f3291] justify-between'>
          <div className='h-1/2 truncate'>
            <button
              className='mr-4'
              onClick={(e) => trackSelected(e, hubData.releases[activeIndexRef.current], activeIndexRef.current)}
            >
              {isPlaying ? `Pause` : `Play`}
            </button>
            {hubData.releases[activeIndexRef.current].metadata.properties.artist} - {hubData.releases[activeIndexRef.current].metadata.properties.title}
          </div>
          <div
            className='h-1/2 w-full'
            onClick={(e) => seek(e)}
          >
            <div 
              id='seek'
              className='bg-[#2f3291] h-full'
              style={{ width: `${(trackProgress / duration * 100) || 0}%` }}
             />
          </div>
        </div>
      </footer>
    </div>
  )
}
