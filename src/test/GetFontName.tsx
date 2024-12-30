// src/test/GetFontName.tsx
import React, { useState } from 'react';
import { getFontNameFromFile } from '../services/getFontName';

const GetFontName: React.FC = () => {
    const [fontName, setFontName] = useState<string | null>(null);
    const fontPath = 'D://dev/raindrops-v3-react/src-tauri/target/debug/_up_/public/fonts/AmaticSC-Regular.ttf'; // Hardcoded font path

    const handleClick = async () => {
        const name = await getFontNameFromFile(fontPath);
        setFontName(name);
    };

    return (
        <div>
            <button onClick={handleClick}>Get Font Name</button>
            {fontName && (
                <p style={{ fontFamily: fontName }}>
                    {fontName}
                </p>
            )}
        </div>
    );
};

export default GetFontName;
