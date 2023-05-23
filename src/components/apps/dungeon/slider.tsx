import { FC, useContext, useState } from "react";
import { MuteContext } from "./mute";

interface SliderProps {
  // value: number;
  onInput: (value: number) => void;
}

const VolumeSlider: FC<SliderProps> = ({ onInput }) => {
  const { volume: globalVolume } = useContext(MuteContext);
  const [volume, setVolume] = useState(globalVolume);

  const handleMouseUp = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    setVolume(newValue);
    onInput(newValue);
  };

  return (
    <input
      type="range"
      min={0}
      max={100}
      defaultValue={volume}
      // onChange={handleSliderChange}
      onMouseUp={handleMouseUp}
      style={{
        width: "4rem",
        transform: "rotate(-90deg)",
        marginLeft: "-1rem",
      }}
    />
  );
};

export default VolumeSlider;
