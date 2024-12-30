// Default

import Layout from './components/Layout'
import "./index.css";
import { LayerProvider } from './context/LayerContext';

function App() {
  return (
    <LayerProvider>
      <Layout />
    </LayerProvider>
  )
}

export default App

// // ------------------------------------------ Font test

// import React from 'react'
// import Layout from './components/Layout'
// import "./index.css";
// import { LayerProvider } from './context/LayerContext';
// import DirectoryCreator from './test/createDirectory';
// import GetFontName from './test/GetFontName';

// function App() {
//   return (
//     <GetFontName />
//   )
// }

// export default App


// // ------------------------------------------ Export test
// import { invoke } from '@tauri-apps/api/core';
// import { open } from '@tauri-apps/plugin-dialog';

// const handleCreateRmskin = async () => {
//     try {
//         const basePath = await open({ directory: true });
//         if (!basePath) return;

//         const outputFileName = `${basePath}/MySkin`;
//         const result = await invoke('create_rmskin', {
//             basePath,
//             outputPath: outputFileName,
//         });

//         alert(`.rmskin created at: ${result}`);
//     } catch (error) {
//         console.error('Error creating .rmskin:', error);
//         alert('Failed to create .rmskin file');
//     }
// };

// export default function App() {
//     return <button onClick={handleCreateRmskin}>Create .rmskin</button>;
// }