import { useContext, useEffect, useState } from 'react';
import ReactAudioPlayer from 'react-h5-audio-player';
import { MuteContext } from './mute';
import 'react-h5-audio-player/lib/styles.css';
import './css/musicPlayer.css'
import Next from './images/Next.png';
import Prev from './images/Prev.png';
import Play from './images/Play.png';
import Pause from './images/Pause.png';

interface MusicTrack {
  src: string;
  name: string;
}

interface MusicPlayerProps {
  tracks: MusicTrack[];
  muteState: number;
}



const MusicPlayer = ({ tracks,muteState }: MusicPlayerProps) => {
  const [audioSrc, setAudioSrc] = useState<string>(tracks[0].src);
  const {  volume } = useContext(MuteContext);

  useEffect(() => {
    const audioElement = document.getElementsByTagName('audio')[0];
    audioElement.volume=volume/100
    if (audioElement) {
      audioElement.pause()
    }
  },[muteState,volume])
  

  const handleMusicButtonClick = (direction: 'next' | 'previous') => {
    // Find the index of the current audio source in the tracks array
    const currentIndex = tracks.findIndex((item) => item.src === audioSrc);
    
  
    // Calculate the index of the next or previous track
    let nextIndex;
    if (direction === 'next') {
      nextIndex = currentIndex < tracks.length - 1 ? currentIndex + 1 : 0;
    } else {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tracks.length - 1;
    }
  
    // Set the audio source to the next or previous track
    setAudioSrc(tracks[nextIndex].src);
  
    // Automatically play the next or previous audio
    setTimeout(() => {
      const audioElement = document.getElementsByTagName('audio')[0];
      if (audioElement) {
        audioElement.play();
      }
    }, 100);
  };

  return (
    <>
      <ReactAudioPlayer
        src={audioSrc}
        layout="horizontal"
        autoPlay={false}
        className='music-player'
        onClickNext={() => handleMusicButtonClick('next')}
        onClickPrevious={() => handleMusicButtonClick('previous')}
        onEnded={() => handleMusicButtonClick('next')}
        showSkipControls={true}
        showDownloadProgress={false}
        showFilledProgress={false}
        customIcons={{
          next: <img src={Next} alt="Next" />,
          previous: <img src={Prev} alt="Prev" />,
          play: <img src={Play} alt="Play" />,
          pause: <img src={Pause} alt="Pause" />,
        }}
      />
    </>
  );
};

export default MusicPlayer;
