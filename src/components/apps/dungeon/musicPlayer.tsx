import { useState } from 'react';
import ReactAudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import './css/musicPlayer.css'

interface MusicTrack {
  src: string;
  name: string;
}

interface MusicPlayerProps {
  tracks: MusicTrack[];
  isOpen:boolean;
}

const MusicPlayer = ({ tracks,isOpen }: MusicPlayerProps) => {
  const [audioSrc, setAudioSrc] = useState<string>(tracks[0].src);
  const [currentTrackName, setCurrentTrackName] = useState<string>(tracks[0].name);

  const handleNextMusicButtonClick = () => {
    // Find the index of the current audio source in the tracks array
    const currentIndex = tracks.findIndex((item) => item.src === audioSrc);

    // Set the audio source to the next item in the tracks array
    if (currentIndex < tracks.length - 1) {
      setAudioSrc(tracks[currentIndex + 1].src);
      setCurrentTrackName(tracks[currentIndex + 1].name);
    } else {
      setAudioSrc(tracks[0].src);
      setCurrentTrackName(tracks[0].name);
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
        style={{ display: isOpen ? 'block' : 'none' }}
        
      />
    </>
  );
};

export default MusicPlayer;
