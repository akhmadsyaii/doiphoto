/**
 * DoiPhoto AI Retoucher Engine
 * Client-side canvas-based image filter processor simulating professional LUTs
 */

interface WatermarkOptions {
  text: string;
  opacity: number;
  size: number;
  smoothFace?: boolean;
  blurPlates?: boolean;
  type?: 'none' | 'text' | 'image' | 'both';
  image?: string | null;
  font?: string;
}

export const applyAIRetouch = (
  imageUrl: string, 
  presetName: string,
  watermarkOptions?: WatermarkOptions,
  manualSettings?: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    warmth: number;
  }
): Promise<string> => {
  return new Promise((resolve) => {
    if ((presetName === 'original' || presetName === 'none') && !watermarkOptions) {
      resolve(imageUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageUrl);
          return;
        }

        // Keep high fidelity dimensions, but constrain maximum size for speed
        const maxDim = 1200;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Apply filters based on preset
        applyPresetFilters(ctx, presetName, manualSettings);

        // Draw original image with filter applied
        ctx.drawImage(img, 0, 0, width, height);

        // Apply advanced composition layers (LUT/Split toning overlays)
        applyPresetOverlays(ctx, width, height, presetName, manualSettings);

        // 1. Simulated AI Face Smoothing Beautification
        if (watermarkOptions?.smoothFace) {
          ctx.save();
          // Draw soft glowing skin radial overlays to simulate facial beautification
          ctx.globalCompositeOperation = 'screen';
          
          // Face location coordinates centered near upper third of photo
          const faceX = width * 0.52;
          const faceY = height * 0.36;
          const faceR = Math.min(width, height) * 0.085;
          
          const faceGrad = ctx.createRadialGradient(faceX, faceY, 0, faceX, faceY, faceR);
          faceGrad.addColorStop(0, 'rgba(255, 232, 215, 0.28)'); // warm skin tone glow
          faceGrad.addColorStop(0.4, 'rgba(255, 232, 215, 0.12)');
          faceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          
          ctx.fillStyle = faceGrad;
          ctx.beginPath();
          ctx.arc(faceX, faceY, faceR, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // 2. Simulated AI License Plate Blur Masking
        if (watermarkOptions?.blurPlates) {
          ctx.save();
          // Draw a privacy block over license plate regions (lower middle third)
          const bx = width * 0.44;
          const by = height * 0.76;
          const bw = width * 0.12;
          const bh = height * 0.045;

          ctx.fillStyle = 'rgba(18, 18, 22, 0.92)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          // Fallback if rounded rect is unsupported in older runtimes
          if (ctx.roundRect) {
            ctx.roundRect(bx, by, bw, bh, 6);
          } else {
            ctx.rect(bx, by, bw, bh);
          }
          ctx.fill();
          ctx.stroke();

          // Privacy mask indicator label
          ctx.font = `bold ${Math.max(9, Math.floor(bh * 0.4))}px monospace`;
          ctx.fillStyle = 'rgba(224, 242, 254, 0.65)'; // light sky blue
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('PRIVACY MASK', bx + bw / 2, by + bh / 2);
          ctx.restore();
        }

        // 3. Batch Watermarking overlay (frame + text layers)
        const drawTextWatermark = () => {
          if (watermarkOptions && watermarkOptions.text && (watermarkOptions.type === 'text' || watermarkOptions.type === 'both')) {
            ctx.save();
            const wText = watermarkOptions.text;
            const wSize = watermarkOptions.size || 20;
            const wOpacity = watermarkOptions.opacity !== undefined ? watermarkOptions.opacity : 0.8;
            const wFont = watermarkOptions.font || 'Outfit';
            
            // Adjust styling based on script font characteristics
            const isScriptFont = ['Sacramento', 'Great Vibes', 'Alex Brush', 'Pacifico'].includes(wFont);
            ctx.font = `${isScriptFont ? '' : 'bold '}${wSize}px '${wFont}', sans-serif`;
            ctx.fillStyle = `rgba(255, 255, 255, ${wOpacity})`;
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            
            // Drop shadow for high visibility contrast in bright/dark areas
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            ctx.fillText(wText, width - 24, height - 24);
            ctx.restore();
          }
        };

        if (watermarkOptions && (watermarkOptions.type === 'image' || watermarkOptions.type === 'both') && watermarkOptions.image) {
          const watermarkImg = new Image();
          watermarkImg.src = watermarkOptions.image;
          watermarkImg.onload = () => {
            try {
              ctx.save();
              ctx.globalAlpha = watermarkOptions.opacity !== undefined ? watermarkOptions.opacity : 1.0;
              ctx.drawImage(watermarkImg, 0, 0, width, height);
              ctx.restore();
            } catch (err) {
              console.error('Error drawing image watermark overlay:', err);
            }
            drawTextWatermark();
            const output = canvas.toDataURL('image/jpeg', 0.85);
            resolve(output);
          };
          watermarkImg.onerror = () => {
            console.error('Error loading image watermark template');
            drawTextWatermark();
            const output = canvas.toDataURL('image/jpeg', 0.85);
            resolve(output);
          };
          return;
        }

        // Draw text overlay if image overlay is not active
        drawTextWatermark();

        // Export as base64 JPEG
        const output = canvas.toDataURL('image/jpeg', 0.85);
        resolve(output);
      } catch (err) {
        console.error('Error processing image canvas filters:', err);
        resolve(imageUrl); // Fallback
      }
    };

    img.onerror = (e) => {
      console.error('Failed to load image for retouching:', e);
      resolve(imageUrl); // Fallback
    };
  });
};

/**
 * Configure Canvas 2D CSS filter context properties
 */
const applyPresetFilters = (
  ctx: CanvasRenderingContext2D, 
  presetName: string,
  manualSettings?: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    warmth: number;
  }
) => {
  switch (presetName) {
    case 'none':
      ctx.filter = 'none';
      break;

    case 'wedding':
      // Wedding Warm Soft: slightly high brightness, lower contrast, soft colors
      ctx.filter = 'brightness(1.06) contrast(0.94) saturate(1.08) sepia(0.06)';
      break;

    case 'sports':
      // Vivid Action: high contrast, high saturation, sharp lighting
      ctx.filter = 'contrast(1.22) saturate(1.30) brightness(1.03)';
      break;

    case 'cinematic':
      // Moody Teal & Orange: high contrast, desaturated
      ctx.filter = 'contrast(1.15) saturate(0.92) brightness(0.98)';
      break;

    case 'monochrome':
      // Classic Noir: pure black & white, boosted contrast
      ctx.filter = 'grayscale(1) contrast(1.35) brightness(0.96)';
      break;

    case 'manual':
    case 'custom':
      if (manualSettings) {
        const { brightness, contrast, saturation, exposure } = manualSettings;
        // Exposure modifies brightness: Exposure value represents stops.
        // A simple clean formula: netBrightness = brightness * (1 + exposure * 0.2)
        const netBrightness = brightness * (1 + exposure * 0.2);
        ctx.filter = `brightness(${Math.max(0.1, netBrightness)}) contrast(${Math.max(0.1, contrast)}) saturate(${Math.max(0, saturation)})`;
      } else {
        ctx.filter = 'none';
      }
      break;

    default:
      ctx.filter = 'none';
      break;
  }
};

/**
 * Apply advanced overlay blending (vignette, split toning, grain)
 */
const applyPresetOverlays = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  presetName: string,
  manualSettings?: {
    brightness: number;
    contrast: number;
    saturation: number;
    exposure: number;
    warmth: number;
  }
) => {
  ctx.save();

  if (presetName === 'wedding') {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(253, 218, 180, 0.22)'; // Peach skin tone overlay
    ctx.fillRect(0, 0, width, height);

    const radialGrad = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.8
    );
    radialGrad.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0.05)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = radialGrad;
    ctx.fillRect(0, 0, width, height);
  } 
  
  else if (presetName === 'cinematic') {
    ctx.globalCompositeOperation = 'color-burn';
    ctx.fillStyle = 'rgba(15, 76, 92, 0.15)'; // Teal shadows
    ctx.fillRect(0, 0, width, height);

    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255, 140, 0, 0.18)'; // Orange highlights
    ctx.fillRect(0, 0, width, height);

    // Vignette
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.4,
      width / 2, height / 2, Math.max(width, height) * 0.8
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
  } 
  
  else if (presetName === 'monochrome') {
    const vignette = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3,
      width / 2, height / 2, Math.max(width, height) * 0.75
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);

    // Procedural film grain
    ctx.globalCompositeOperation = 'overlay';
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = 128;
    noiseCanvas.height = 128;
    const noiseCtx = noiseCanvas.getContext('2d');
    
    if (noiseCtx) {
      const noiseData = noiseCtx.createImageData(128, 128);
      const data = noiseData.data;
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.floor(Math.random() * 255);
        data[i] = value;
        data[i + 1] = value;
        data[i + 2] = value;
        data[i + 3] = 22;
      }
      noiseCtx.putImageData(noiseData, 0, 0);
      
      const pattern = ctx.createPattern(noiseCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
      }
    }
  }

  else if ((presetName === 'manual' || presetName === 'custom') && manualSettings) {
    const { warmth } = manualSettings;
    if (warmth > 0) {
      // Warm Amber tint simulating golden warming filters
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(253, 186, 116, ${warmth * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    } else if (warmth < 0) {
      // Cool Blue tint simulating tungsten cooling filters
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(147, 197, 253, ${Math.abs(warmth) * 0.25})`;
      ctx.fillRect(0, 0, width, height);
    }
  }

  ctx.restore();
};
