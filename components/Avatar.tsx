import React, { useState, useEffect, createContext, useContext, useMemo } from 'react';

interface AvatarContextValue {
  imageStatus: 'idle' | 'loading' | 'loaded' | 'error';
  setImageStatus: React.Dispatch<React.SetStateAction<'idle' | 'loading' | 'loaded' | 'error'>>;
}

const AvatarContext = createContext<AvatarContextValue | null>(null);

const useAvatarContext = () => {
  const context = useContext(AvatarContext);
  if (!context) {
    throw new Error('Avatar components must be used within an Avatar provider');
  }
  return context;
};

const Avatar: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  return (
    <AvatarContext.Provider value={{ imageStatus, setImageStatus }}>
      <div
        className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className || ''}`}
      >
        {children}
      </div>
    </AvatarContext.Provider>
  );
};

const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ src, className, ...props }) => {
  const { imageStatus, setImageStatus } = useAvatarContext();

  // FIX: Handle Blob type for `src` prop by creating an object URL.
  const objectUrl = useMemo(() => {
    if (src instanceof Blob) {
      return URL.createObjectURL(src);
    }
    return null;
  }, [src]);

  const imageUrl = typeof src === 'string' ? src : objectUrl;

  useEffect(() => {
    if (!imageUrl) {
      setImageStatus('error');
      return;
    }

    let isMounted = true;
    setImageStatus('loading');
    const image = new window.Image();
    image.src = imageUrl;
    image.onload = () => {
      if (isMounted) setImageStatus('loaded');
    };
    image.onerror = () => {
      if (isMounted) setImageStatus('error');
    };

    return () => {
      isMounted = false;
      // Revoke the object URL on cleanup to prevent memory leaks.
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [imageUrl, objectUrl, setImageStatus]);

  return imageStatus === 'loaded' ? (
    <img src={imageUrl || undefined} className={`aspect-square h-full w-full ${className || ''}`} {...props} />
  ) : null;
};

const AvatarFallback: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => {
  const { imageStatus } = useAvatarContext();

  return (imageStatus === 'error' || imageStatus === 'loading') ? (
    <div
      className={`flex h-full w-full items-center justify-center rounded-full bg-gray-700 border border-white/10 text-gray-300 font-bold ${className || ''}`}
    >
      {children}
    </div>
  ) : null;
};

export { Avatar, AvatarImage, AvatarFallback };
