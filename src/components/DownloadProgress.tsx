import React, { useEffect } from 'react';

interface DownloadProgressProps {
  progress: number;
  onClose: () => void;
}

const DownloadProgress: React.FC<DownloadProgressProps> = ({ progress, onClose }) => {
  useEffect(() => {
    if (progress >= 100) {
      setTimeout(onClose, 2000); // Close after 2 seconds when download is complete
    }
  }, [progress, onClose]);

  return (
    <div className="fixed bottom-4 right-4 z-[100] p-4 bg-white shadow-lg rounded-md">
      <div className="flex items-center justify-between">
        <span>Downloading: {progress}%</span>
        <button onClick={onClose} className="ml-4 text-red-500">Close</button>
      </div>
      <progress value={progress} max="100" className="w-full mt-2"></progress>
    </div>
  );
};

export default DownloadProgress;