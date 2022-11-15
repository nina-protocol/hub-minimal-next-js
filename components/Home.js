import { useEffect, useState, useRef, useMemo } from 'react'
import NinaSdk from '@nina-protocol/js-sdk'
import { useConnection, useWallet, } from '@solana/wallet-adapter-react';
import {
  useWalletModal,
} from '@solana/wallet-adapter-react-ui';
import { useSnackbar } from 'react-simple-snackbar'
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Image from 'next/image'
import { getImageFromCDN, loader } from '../utils/imageManager'

const formatDuration = (duration) => {
  let sec_num = parseInt(duration, 10)
  let hours = Math.floor(sec_num / 3600)
  let minutes = Math.floor((sec_num - hours * 3600) / 60)
  let seconds = sec_num - hours * 3600 - minutes * 60

  if (hours > 0) {
    minutes += hours * 60
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  return minutes + ':' + seconds
}

const Home = () => {
  const options = {
    position: 'top-right',
    style: {
      backgroundColor: '#2d81ff',
      color: 'white',
      fontFamily: 'SFMono-Regular, monospace',
      fontSize: '16px',
      textAlign: 'center',
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
  // const [seekMousePosition, setSeekMousePosition] = useState(0)
  const [userCollection, setUserCollection] = useState([])
  const [releasePurchaseAfterConnection, setReleasePurchaseAfterConnection] = useState(undefined)
  const playerRef = useRef()
  const activeIndexRef = useRef(0)
  const intervalRef = useRef()
  const [shouldScroll, setShouldScroll] = useState(false)

  const loadHub = async () => {
    await NinaSdk.client.init(
      process.env.NINA_API_ENDPOINT,
      process.env.SOLANA_CLUSTER_URL,
      process.env.NINA_PROGRAM_ID
    )      
    const hub = await NinaSdk.Hub.fetch(process.env.NINA_HUB_ID, true)
    setHubData(hub)
    playerRef.current = document.querySelector('#audio')
    console.log('window.location.hash', window.location)
    if (window.location.search.length > 0) {
      const hash = window.location.search.replace('?r=', '')
      const releases = hub.releases.sort((a,b) => b.accountData.hubContent.datetime - a.accountData.hubContent.datetime)
      const index = releases.findIndex(release => release.publicKey === hash)
      if (index > -1) {
        setToggledIds([index])
        setTrack(releases[index].metadata.animation_url)
        setShouldScroll(true)
        activeIndexRef.current = index
      }
    }
  }

  useEffect(() => {
    loadHub()
    return () => {
      clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (shouldScroll) {
      const hash = window.location.search.replace('?r=', '')
      const section = document.querySelector( `#${hash}` );
      section.scrollIntoView( { behavior: 'auto', block: 'start' } );
      setShouldScroll(false)
    }
  }, [shouldScroll])

  useEffect(() => {
    if (wallet.connected) {
      getUserCollection()
      if (releasePurchaseAfterConnection) {
        handlePuchaseClick(undefined, releasePurchaseAfterConnection)
        setReleasePurchaseAfterConnection(undefined)
      }  
    }
  }, [wallet.connected, releasePurchaseAfterConnection])

  const getUserCollection = async () => {
    const { collected } = await NinaSdk.Account.fetchCollected(wallet.publicKey)
    setUserCollection(collected.map(release => release.publicKey))
  }
  const trackSelected = (event, release, index) => {
    if (!playerRef.current) {
      playerRef.current = document.querySelector('#audio')
    }
    event?.preventDefault()
    activeIndexRef.current = index
    if (track === release.metadata.animation_url) {
      if (isPlaying) {
        playerRef.current.pause()
        setIsPlaying(false)
      } else {
        playerRef.current.play()
        setDuration(playerRef.current.duration)
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
    () => activeIndexRef.current + 1 <= hubData?.releases.length - 1,
    [activeIndexRef.current, hubData]
  )

  const hasPrev = useMemo(
    () => activeIndexRef.current - 1 >= 0,
    [activeIndexRef.current, hubData]
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
    if (playerRef.current.duration) {
      const percent = e.nativeEvent.offsetX / e.currentTarget.offsetWidth
      playerRef.current.currentTime = percent * playerRef.current.duration
      setTrackProgress(Math.ceil(playerRef.current.currentTime))
    }
  }

  // const mouseEnterSeekbar = (e) => {
  //   const percent = e.nativeEvent.offsetX / e.currentTarget.offsetWidth
  //   setSeekMousePosition(percent * playerRef.current.duration)
  // }

  const handlePuchaseClick = async (e, release) => {
    if (e) {
      e.preventDefault()
    }

    if (release.accountData.release.remainingSupply <= 0) {
      return
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
    return <p className='mt-2 ml-2 text-sm text-black font-mono'>Loading...</p>
  }
  
  return (
    <div className='flex flex-col h-screen justify-between text-sm font-mono overflow-x-hidden text-black'>
      <div className='flex flex-col md:flex-row'>
        <div className='max-w-lg pb-10 sticky'>
          <div className='sticky top-2'>
            <p className='mt-2 ml-2 mb-2'>{hubData.hub.data.displayName}</p>
            <div className='m-1'>
              <Image
                loader={loader}
                width={400}
                height={400}
                layout="responsive"
                src={getImageFromCDN(hubData.hub.data.image, 1000)}
                priority={true}
              />
            </div>
            <p className='mt-2 ml-2 mb-6'>
              {hubData.hub.data.description}
            </p>
          </div>
          <audio id="audio" style={{ width: '100%' }}>
            <source src={track} type="audio/mp3" />
          </audio>
        </div>
        <div className='md:pt-10 pb-10 md:pl-10 md:w-1/2 ms:max-w-lg'>
          {hubData.releases.sort((a,b) => b.accountData.hubContent.datetime - a.accountData.hubContent.datetime).map((release, i) => (
            <>
              <hr id={release.publicKey} />
              <div className='w-full mt-2 mb-2'>
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
                <div className='max-w-lg'>
                  <div className='m-2'>
                    <Image
                      loader={loader}
                      width={400}
                      height={400}
                      layout="responsive"
                      src={getImageFromCDN(release.metadata.image, 1000)}
                      priority={true}
                    />
                  </div>
                  <div className='m-2 ml-4 mr-4'>
                    <p className='mt-2'>{release.metadata.description}</p>
                    <p className='mt-2'>
                      <span>{release.accountData.release.remainingSupply} / {release.accountData.release.totalSupply} Remaining</span> 
                    </p>
                    {userCollection.includes(release.publicKey) && (
                      <p className='mt-2 font-bold'>
                        <span>You own this release</span>
                      </p>
                    )}
                    <p className='mt-2'>
                      <span>
                        <button
                          className="border border-[#000] p-2 disabled:opacity-50"
                          onClick={(e) => handlePuchaseClick(e, release)}
                          disabled={release.accountData.release.remainingSupply <= 0}>
                            {release.accountData.release.remainingSupply > 0 ? `${wallet.publicKey ? '' : 'Connect to '}Purchase (${(release.accountData.release.price / 1000000).toFixed(2)} USDC)` : 'Sold Out'}
                        </button>
                      </span>
                    </p>
                    <CopyToClipboard 
                      text={`${window.location.origin}/?r=${release.publicKey}`}
                      onCopy={() => openSnackbar('Release link copied.')}
                    >
                      <p className='mt-2 text-xs cursor-pointer'>Permalink</p>
                    </CopyToClipboard>
                  </div>
                </div>
              )}
            </>
          ))}
      </div>

      </div>
      <footer className='h-10 fixed bottom-0 w-full'>
        <div className='bg-[#fff] h-full border-2 border-[#000] justify-between'>
          <div className='h-1/2 truncate'>
            <button
              className={`mr-4 ml-2 disabled:opacity-50`}
              disabled={!hasPrev}
              onClick={(e) => trackSelected(e, hubData.releases[activeIndexRef.current - 1], activeIndexRef.current - 1)}
              >
              {'<<'}
            </button>
            <button
              className='mr-4'
              onClick={(e) => trackSelected(e, hubData.releases[activeIndexRef.current], activeIndexRef.current)}
            >
              {isPlaying ? `Pause` : `Play`}
            </button>
            <button
              className='mr-4 disabled:opacity-50'
              disabled={!hasNext}
              onClick={(e) => trackSelected(e, hubData.releases[activeIndexRef.current + 1], activeIndexRef.current + 1)}
              >
              {'>>'}
            </button>
            {hubData.releases[activeIndexRef.current].metadata.properties.artist} - {hubData.releases[activeIndexRef.current].metadata.properties.title}
            {` - [${formatDuration(
                  trackProgress
                )} / ${formatDuration(
                  hubData.releases[activeIndexRef.current].metadata.properties.files[0].duration || duration
                )}]`}
          </div>
          <div
            className='h-1/2 w-full cursor-pointer'
            onClick={(e) => seek(e)}
            // onMouseEnter={(e) => mouseEnterSeekbar(e)}
            // onMouseMove={(e) => mouseEnterSeekbar(e)}
            // onMouseLeave={(e) => setSeekMousePosition(0)}
          >
            <div 
              id='seek'
              className='bg-[#000] h-full'
              style={{ width: `${(trackProgress / duration * 100) || 0}%` }}
             />
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home;