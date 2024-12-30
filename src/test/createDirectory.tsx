import React, { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';
import { mkdir, writeFile } from '@tauri-apps/plugin-fs'; // Import writeFile

const DirectoryCreator: React.FC = () => {
  const [status, setStatus] = useState('');

  const handleCreateDirectory = async () => {
    // Open dialog for the user to select a directory
    const selectedDirectory = await open({
      title: 'Select a Directory',
      directory: true,
    });

    if (selectedDirectory) {
      // Specify the new directory name
      const newDirectoryName = 'MyNewDirectory4'; // or however you want to name it
      const newDirectoryPath = `${selectedDirectory}/${newDirectoryName}`;

      // Create the new directory
      try {
        await mkdir(newDirectoryPath);
        setStatus('Directory created successfully.');

        // Create the sample .txt file in the new directory
        const sampleFilePath = `${newDirectoryPath}/sample.ini`; // Specify the file path
        const sampleContent = 'This is a sample text file.'; // Content for the sample file

        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const encodedContent = encoder.encode(sampleContent);

        await writeFile(sampleFilePath, encodedContent);
        setStatus('Directory and file created successfully.');
      } catch (error) {
        console.error('Failed to create directory or file:', error);
        setStatus('Failed to create directory or file.');
      }
    }
  };

  return (
    <div>
      <button onClick={handleCreateDirectory}>Create Directory</button>
      <p>{status}</p>
    </div>
  );
};

export default DirectoryCreator;
