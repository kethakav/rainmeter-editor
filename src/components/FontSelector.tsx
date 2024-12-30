import { useState } from 'react';

const fontList = ['Arial', 'Roboto', 'Open Sans', 'Courier New'];

interface FontSelectorProps {
  onChange: (font: string) => void; // Add onChange prop typing
}

function FontSelector({ onChange }: FontSelectorProps) {
  const [selectedFont, setSelectedFont] = useState('Arial');

  const handleFontChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newFont = e.target.value;
    setSelectedFont(newFont);
    onChange(newFont); // Call the onChange prop with the new font
  };

  return (
    <div>
      <select onChange={handleFontChange} value={selectedFont}>
        {fontList.map((font) => (
          <option key={font} value={font}>
            {font}
          </option>
        ))}
      </select>
    </div>
  );
}

export default FontSelector;
