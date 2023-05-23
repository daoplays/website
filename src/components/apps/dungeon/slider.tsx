import { FC, useState } from 'react';

interface SliderProps {
  value: number;
  onInput: (value: number) => void;
}

const VolumeSlider: FC<SliderProps> = ({ value, onInput }) => {
  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    // onInput(newValue);
  };

  return (
    <input
      type="range"
      min={0}
      max={100}
      defaultValue={value}
      onInput={handleSliderChange}
      readOnly
    />
  );
};

export default VolumeSlider;
