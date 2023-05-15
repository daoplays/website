import { Button, Box } from '@chakra-ui/react';
import { FC, useEffect, useState } from 'react';
import { createContext } from 'react';
import soundOnImg from './images/Sound_On.png';
import soundOffImg from './images/Sound_Off.png';
import './css/mute.css';

enum MuteState {
  Unmuted,
  Muted,
  VolumeSlider,
}

interface MuteButtonProps {
  muteState: MuteState;
  toggleMute: () => void;
  volume: number;
  setVolume: (value: number) => void;
}

export const MuteButton: FC<MuteButtonProps> = ({ muteState, toggleMute, volume, setVolume }) => {
  let content;
  switch (muteState) {
    case MuteState.Muted:
      content = <img src={soundOffImg} alt="Sound Off" />;
      break;
    case MuteState.Unmuted:
      content = <img src={soundOnImg} alt="Sound On" />;
      break;
    case MuteState.VolumeSlider:
      content = (
        <Box width="3rem">
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </Box>

      );
      break;
  }

  return (
    <Button size='md' onClick={toggleMute} className='mute-button'>
      <div className="font-face-sfpb">
        {content}
      </div>
    </Button>
  );
};

export const MuteContext = createContext<MuteButtonProps>({
  muteState: MuteState.Unmuted,
  toggleMute: () => { },
  volume: 50,
  setVolume: () => { },
});

export const MuteProvider = ({ children, isMuted: initialMuted }: React.PropsWithChildren<{ isMuted: boolean }>) => {
  const [muteState, setMuteState] = useState(initialMuted ? MuteState.Muted : MuteState.VolumeSlider);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    // console.log('mute provider')
  }, [])

  const toggleMute = () => {

    setMuteState((prevState) => {
      console.log(prevState)
      switch (prevState) {
        case MuteState.Unmuted:
          return MuteState.Muted;
        case MuteState.Muted:
          return MuteState.VolumeSlider;
        case MuteState.VolumeSlider:
          return MuteState.Unmuted;
      }
    });
  };

  return <MuteContext.Provider value={{ muteState, toggleMute, volume, setVolume }}>{children}</MuteContext.Provider>;
};
