import { Button } from '@chakra-ui/react';
import { FC, useEffect } from 'react';
import { createContext, useState } from 'react';
import soundOnImg from './images/Sound_On.png';
import soundOffImg from './images/Sound_Off.png';
import './css/mute.css';

interface MuteButtonProps {
  isMuted: boolean;
  toggleMute: () => void;
}

interface MuteContextType {
    isMuted: boolean;
    toggleMute: () => void;
  }

export const MuteButton: FC<MuteButtonProps> = ({ isMuted, toggleMute }) => {
    return (
        <Button size='md' onClick={toggleMute} className='mute-button'>
            <div className="font-face-sfpb">
                {isMuted ? <img src={soundOffImg} alt="Sound Off" /> : <img src={soundOnImg} alt="Sound On" />}
            </div>
        </Button>
    );
};



export const MuteContext = createContext<MuteContextType>({
  isMuted: false,
  toggleMute: () => {},
});

export const MuteProvider = ({ children, isMuted: initialMuted }: React.PropsWithChildren<{ isMuted: boolean }>) => {
  const [isMuted, setIsMuted] = useState(initialMuted);
  useEffect(() => {
    // console.log('mute provider')
  
  }, [])
  

  const toggleMute = () => {
      setIsMuted(!isMuted);
    //   console.log('Mute button clicked!');
  };

  return <MuteContext.Provider value={{ isMuted, toggleMute }}>{children}</MuteContext.Provider>;
};