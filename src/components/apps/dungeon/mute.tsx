import { Button, Box, Flex } from "@chakra-ui/react";
import { FC, useState, useContext, createContext } from "react";
import soundOnImg from "./images/Sound_On.png";
import soundOffImg from "./images/Sound_Off.png";
import "./css/mute.css";
import VolumeSlider from "./slider";

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

export const MuteContext = createContext<MuteButtonProps>({
  muteState: MuteState.Unmuted,
  toggleMute: () => {},
  volume: 50,
  setVolume: () => {},
});

export const MuteButton: FC = () => {
  const { muteState, toggleMute, setVolume } = useContext(MuteContext);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
  };

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
        <Flex
          direction="column"
          alignItems="center"
          className="volume-slider-flex"
        >
          <img src={soundOnImg} alt="Sound On" />
          <Box width="1.5rem" height="0.3rem" marginTop="2rem">
            <VolumeSlider onInput={handleVolumeChange} />
          </Box>
        </Flex>
      );
      break;
  }

  return (
    <Button size="md" onClick={toggleMute} className="mute-button">
      <div className="font-face-sfpb">{content}</div>
    </Button>
  );
};

export const MuteProvider = ({
  children,
  isMuted: initialMuted,
}: React.PropsWithChildren<{ isMuted: boolean }>) => {
  const [muteState, setMuteState] = useState(
    initialMuted ? MuteState.Muted : MuteState.Unmuted
  );
  const [volume, setVolume] = useState(50);

  const toggleMute = () => {
    setMuteState((prevState) => {
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

  return (
    <MuteContext.Provider value={{ muteState, toggleMute, volume, setVolume }}>
      {children}
    </MuteContext.Provider>
  );
};
