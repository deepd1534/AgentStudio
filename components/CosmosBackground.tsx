import React from 'react';

const CosmosBackground: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 w-full h-full z-0 overflow-hidden bg-gray-900">
      <style>
        {`
          @keyframes move-blob-1 {
            0% { transform: translate(10vw, -10vh) scale(1); }
            50% { transform: translate(-20vw, 20vh) scale(1.2); }
            100% { transform: translate(10vw, -10vh) scale(1); }
          }
          @keyframes move-blob-2 {
            0% { transform: translate(80vw, 70vh) scale(1.1); }
            50% { transform: translate(50vw, 10vh) scale(0.9); }
            100% { transform: translate(80vw, 70vh) scale(1.1); }
          }
          @keyframes move-blob-3 {
            0% { transform: translate(-10vw, 80vh) scale(0.9); }
            50% { transform: translate(30vw, 40vh) scale(1.1); }
            100% { transform: translate(-10vw, 80vh) scale(0.9); }
          }
          .blob-1 {
            animation: move-blob-1 45s infinite ease-in-out;
          }
          .blob-2 {
            animation: move-blob-2 55s infinite ease-in-out;
          }
          .blob-3 {
            animation: move-blob-3 65s infinite ease-in-out;
          }
        `}
      </style>
      <div className="absolute top-0 left-0 w-[50vmax] h-[50vmax] rounded-full bg-cyan-500/20 blur-3xl filter blob-1" />
      <div className="absolute top-0 left-0 w-[40vmax] h-[40vmax] rounded-full bg-blue-500/20 blur-3xl filter blob-2" />
      <div className="absolute top-0 left-0 w-[30vmax] h-[30vmax] rounded-full bg-purple-500/10 blur-3xl filter blob-3" />
    </div>
  );
};

export default CosmosBackground;
