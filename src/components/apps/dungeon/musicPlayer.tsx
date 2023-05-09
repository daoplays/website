import { useEffect, useState } from 'react';
import ReactAudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './css/musicPlayer.css'

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
  

  const handleNextMusicButtonClick = () => {
    // Find the index of the current audio source in the tracks array
    const currentIndex = tracks.findIndex((item) => item.src === audioSrc);

    // Set the audio source to the next item in the tracks array
    if (currentIndex < tracks.length - 1) {
      setAudioSrc(tracks[currentIndex + 1].src);
    } else {
      setAudioSrc(tracks[0].src);
    }

    // Automatically play next audio on click next button
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
        onClickNext={handleNextMusicButtonClick}
        onEnded={handleNextMusicButtonClick}
        showSkipControls={true}
      />
    </>
  );
};

export default MusicPlayer;
