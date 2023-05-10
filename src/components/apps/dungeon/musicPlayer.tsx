import { useEffect, useState } from 'react';
import ReactAudioPlayer from 'react-h5-audio-player';
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
  isMuted: boolean;
}

const MusicPlayer = ({ tracks,isMuted }: MusicPlayerProps) => {
  const [audioSrc, setAudioSrc] = useState<string>(tracks[0].src);

  useEffect(() => {
    const audioElement = document.getElementsByTagName('audio')[0];
    if (audioElement) {
      audioElement.pause()
    }
  },[isMuted])
  

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
        autoPlay={false}
        className='music-player'
        onClickNext={() => handleMusicButtonClick('next')}
        onClickPrevious={() => handleMusicButtonClick('previous')}
        onEnded={() => handleMusicButtonClick('next')}
        showSkipControls={true}
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
