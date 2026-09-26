import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop, convertToPixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check } from 'lucide-react';

interface ImageCropModalProps {
  imageUrl: string;
  onClose: () => void;
  onCropApply: (croppedImageUrl: string, width: number, height: number, naturalWidth: number, naturalHeight: number) => void;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export function ImageCropModal({ imageUrl, onClose, onCropApply }: ImageCropModalProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [aspect, setAspect] = useState<number | undefined>(undefined);

  function initCrop(img: HTMLImageElement) {
    if (!crop && !completedCrop) {
      setCrop(centerAspectCrop(img.width, img.height, 16 / 9));
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    initCrop(e.currentTarget);
  }

  React.useEffect(() => {
    if (imgRef.current && imgRef.current.complete) {
      initCrop(imgRef.current);
    }
  }, []);

  const handleAspectChange = (newAspect: number | undefined) => {
    setAspect(newAspect);
    if (imgRef.current) {
      const { width, height } = imgRef.current;
      if (newAspect) {
        setCrop(centerAspectCrop(width, height, newAspect));
      }
    }
  };

  const handleApply = async () => {
    let finalCrop = completedCrop;
    if (!finalCrop && crop && imgRef.current) {
      finalCrop = convertToPixelCrop(crop, imgRef.current.width, imgRef.current.height);
    }

    if (!finalCrop || !imgRef.current) {
      alert("DEBUG: finalCrop or imgRef is missing");
      onClose();
      return;
    }

    try {
      const image = imgRef.current;
      const canvas = document.createElement('canvas');
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;
      
      const pixelRatio = window.devicePixelRatio || 1;
      
      canvas.width = Math.floor(finalCrop.width * scaleX * pixelRatio);
      canvas.height = Math.floor(finalCrop.height * scaleY * pixelRatio);

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2d context');

      ctx.scale(pixelRatio, pixelRatio);
      ctx.imageSmoothingQuality = 'high';

      const cropX = finalCrop.x * scaleX;
      const cropY = finalCrop.y * scaleY;
      const cropWidth = finalCrop.width * scaleX;
      const cropHeight = finalCrop.height * scaleY;

      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const base64Image = canvas.toDataURL('image/jpeg', 0.9);
      onCropApply(base64Image, cropWidth, cropHeight, image.naturalWidth, image.naturalHeight);
    } catch (e) {
      console.error(e);
      alert("Cannot crop this image due to CORS restrictions. The original server blocks image data extraction.");
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'var(--sidebar-bg)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', width: '90%', maxWidth: '900px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 'bold' }}>Crop Image</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => handleAspectChange(undefined)} className={aspect === undefined ? "btn-primary" : "btn-secondary"}>Free</button>
          <button onClick={() => handleAspectChange(1)} className={aspect === 1 ? "btn-primary" : "btn-secondary"}>1:1</button>
          <button onClick={() => handleAspectChange(16/9)} className={aspect === 16/9 ? "btn-primary" : "btn-secondary"}>16:9</button>
          <button onClick={() => handleAspectChange(4/3)} className={aspect === 4/3 ? "btn-primary" : "btn-secondary"}>4:3</button>
        </div>

        <div style={{ background: 'black', borderRadius: '8px', overflow: 'hidden', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px', maxHeight: '60vh' }}>
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              onLoad={onImageLoad}
              style={{ maxHeight: '60vh', objectFit: 'contain' }}
              crossOrigin="anonymous" // needed for external images to avoid tainted canvas
            />
          </ReactCrop>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleApply} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Check size={16} /> Apply Crop</button>
        </div>
      </div>
    </div>
  );
}
