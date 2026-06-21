"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./Button";
import { Card } from "./Card";

interface ImageCropperModalProps {
  imageSrc: string;
  onCropComplete: (file: File) => void;
  onCancel: () => void;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  imageSrc,
  onCropComplete,
  onCancel,
}) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reset zoom and offset when image source changes
  useEffect(() => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [imageSrc]);

  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Calculate scale to fill a 300x300 container
    const scaleX = 300 / img.naturalWidth;
    const scaleY = 300 / img.naturalHeight;
    // We want the image to completely cover the container (min-scale is the max of both fits)
    const minScale = Math.max(scaleX, scaleY);
    setBaseScale(minScale);
  };

  // Mouse Drag Events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Drag Events for Mobile Support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!imageRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // 1. Clear background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 400, 400);

      // 2. Translate center of canvas
      ctx.translate(200, 200);

      // 3. Apply offset and scale mapping from container (300px) to canvas (400px)
      const canvasScale = 400 / 300;
      ctx.translate(offset.x * canvasScale, offset.y * canvasScale);

      const finalScale = zoom * baseScale * canvasScale;
      ctx.scale(finalScale, finalScale);

      // 4. Draw image centered
      ctx.drawImage(
        imageRef.current,
        -imageRef.current.naturalWidth / 2,
        -imageRef.current.naturalHeight / 2
      );

      // 5. Output cropped image blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const croppedFile = new File([blob], "healer-profile.jpg", {
              type: "image/jpeg",
            });
            onCropComplete(croppedFile);
          }
        },
        "image/jpeg",
        0.92
      );
    }
  };

  return (
    <div className="crop-modal-overlay">
      <Card variant="glass" className="crop-modal-card">
        <h3 className="crop-title">Crop Profile Picture</h3>
        <p className="crop-subtitle">
          Drag the image to position and use the slider to zoom. The photo will be cropped to a circle.
        </p>

        {/* Crop Window Container */}
        <div
          ref={containerRef}
          className="crop-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Source to crop"
            onLoad={handleImageLoaded}
            style={{
              transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px) scale(${
                zoom * baseScale
              })`,
            }}
            className="crop-image"
          />
          {/* Circular mask overlay */}
          <div className="crop-mask-circle"></div>
        </div>

        {/* Zoom Controls */}
        <div className="crop-controls">
          <span className="zoom-icon">➖</span>
          <input
            type="range"
            min="1"
            max="3"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="zoom-slider"
          />
          <span className="zoom-icon">➕</span>
          <button
            type="button"
            className="reset-btn"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            Reset
          </button>
        </div>

        {/* Action Buttons */}
        <div className="crop-actions">
          <Button variant="glass" onClick={onCancel} type="button">
            Cancel
          </Button>
          <Button variant="gold" onClick={handleCrop} type="button">
            Crop & Save Profile Picture
          </Button>
        </div>
      </Card>

      <style jsx>{`
        .crop-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 12, 30, 0.45);
          backdrop-filter: blur(16px);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        :global(.crop-modal-card) {
          max-width: 420px;
          width: 100%;
          padding: 28px !important;
          border: 1px solid var(--gold-border) !important;
          box-shadow: 0 20px 50px rgba(76, 29, 149, 0.15) !important;
          text-align: center;
        }

        .crop-title {
          font-family: var(--font-serif);
          font-size: 1.4rem;
          color: #4c1d95;
          margin-bottom: 8px;
        }

        .crop-subtitle {
          font-size: 0.82rem;
          color: hsl(var(--text-muted));
          line-height: 1.5;
          margin-bottom: 24px;
        }

        .crop-container {
          position: relative;
          width: 300px;
          height: 300px;
          margin: 0 auto 24px;
          border-radius: 12px;
          overflow: hidden;
          background: #111;
          user-select: none;
          cursor: move;
          touch-action: none;
          box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
        }

        .crop-image {
          position: absolute;
          top: 50%;
          left: 50%;
          max-width: none;
          max-height: none;
          pointer-events: none;
          transform-origin: center center;
        }

        .crop-mask-circle {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          box-shadow: 0 0 0 9999px rgba(15, 12, 30, 0.65);
          border: 2px dashed rgba(212, 175, 55, 0.7);
          pointer-events: none;
        }

        .crop-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .zoom-icon {
          font-size: 0.85rem;
          user-select: none;
        }

        .zoom-slider {
          flex-grow: 1;
          height: 5px;
          border-radius: 99px;
          outline: none;
          accent-color: #d4af37;
          background: rgba(124, 58, 237, 0.15);
          cursor: pointer;
        }

        .reset-btn {
          background: transparent;
          border: none;
          color: #7c3aed;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .reset-btn:hover {
          background: rgba(124, 58, 237, 0.06);
        }

        .crop-actions {
          display: flex;
          gap: 12px;
          justify-content: center;
        }

        :global(.crop-actions button) {
          flex: 1;
          font-size: 0.82rem !important;
          padding: 10px 16px !important;
        }
      `}</style>
    </div>
  );
};
