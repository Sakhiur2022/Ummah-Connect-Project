"use client";
import React, { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";

interface CropperModalProps {
  image: string;
  onClose: () => void;
  onCropComplete: (blob: Blob) => void;
}

export default function CropperModal({
  image,
  onClose,
  onCropComplete,
}: CropperModalProps) {
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback(
    (_: Area, areaPixels: Area) => {
      setCroppedAreaPixels(areaPixels);
    },
    []
  );

  // Load image safely
  const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
    });
  };

  // Create cropped blob
  const getCroppedImg = async (): Promise<Blob> => {
    if (!croppedAreaPixels) {
      throw new Error("Cropping area not ready");
    }

    const imageEl = await loadImage(image);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

    const { width, height, x, y } = croppedAreaPixels;

    canvas.width = width;
    canvas.height = height;

    ctx.drawImage(imageEl, x, y, width, height, 0, 0, width, height);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob as Blob),
        "image/jpeg",
        1
      );
    });
  };

  const handleDone = async () => {
    const blob = await getCroppedImg();
    onCropComplete(blob);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[9999]">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-4 w-[90%] max-w-md shadow-xl">

        <div className="relative w-full h-64 rounded-md overflow-hidden">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
          />
        </div>

        <input
          type="range"
          min={1}
          max={3}
          step={0.05}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-full my-4"
        />

        <div className="flex justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-gray-300 rounded">
            Cancel
          </button>

          <button
            onClick={handleDone}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Crop & Save
          </button>
        </div>
      </div>
    </div>
  );
}
