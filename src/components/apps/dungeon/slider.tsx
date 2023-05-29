import { FC, MouseEventHandler, useContext, useState } from "react";
import { MuteContext } from "./mute";
import "./css/slider.css";


interface SliderProps {
  // value: number;
  onInput: (value: number) => void;
}

const VolumeSlider: FC<SliderProps> = ({ onInput }) => {
  const { volume: globalVolume } = useContext(MuteContext);
  const [volume, setVolume] = useState(globalVolume);

  const handleMouseUp: MouseEventHandler<HTMLInputElement> = (event) => {
    const newValue = parseInt((event.target as HTMLInputElement).value, 10);
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
      onMouseUp={handleMouseUp}
      
    />
  );
};

export default VolumeSlider;
