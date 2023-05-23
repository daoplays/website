import { FC, useContext, useState } from "react";
import { MuteContext } from "./mute";
import "./css/slider.css";


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
      className='volume-slider'
      min={0}
      max={100}
      defaultValue={volume}
      // onChange={handleSliderChange}
      onMouseUp={handleMouseUp}
      
    />
  );
};

export default VolumeSlider;
