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
  framePreset?: string;
}

const getBottomBannerHeight = (preset: string, height: number): number => {
  switch (preset) {
    case 'polaroid':
      return Math.round(height * 0.12);
    case 'wedding_gold':
      return Math.round(height * 0.20);
    case 'midnight_luxury':
      return Math.round(height * 0.22);
    case 'silver_sparkles':
      return Math.round(height * 0.15);
    case 'rose_gold_floral':
      return Math.round(height * 0.22);
    case 'cherry_blossom':
      return Math.round(height * 0.18);
    case 'christmas_holiday':
      return Math.round(height * 0.18);
    default:
      return 0;
  }
};

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
            
            // Drop shadow for high visibility contrast in bright/dark areas
            ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;
            
            const bannerH = getBottomBannerHeight(watermarkOptions.framePreset || '', height);
            if (bannerH > 0) {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              if (watermarkOptions.framePreset === 'polaroid' || watermarkOptions.framePreset === 'wedding_gold') {
                if (watermarkOptions.framePreset === 'polaroid') {
                  ctx.fillStyle = `rgba(30, 41, 59, ${wOpacity})`;
                  ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
                } else {
                  ctx.fillStyle = `rgba(180, 83, 9, ${wOpacity})`;
                  ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
                }
              } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${wOpacity})`;
              }
              ctx.fillText(wText, width / 2, height - bannerH / 2);
            } else {
              ctx.fillStyle = `rgba(255, 255, 255, ${wOpacity})`;
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              ctx.fillText(wText, width - 24, height - 24);
            }
            ctx.restore();
          }
        };

        // Draw built-in frame preset if selected and not 'custom'
        if (watermarkOptions && watermarkOptions.framePreset && watermarkOptions.framePreset !== 'none' && watermarkOptions.framePreset !== 'custom') {
          drawFramePreset(ctx, width, height, watermarkOptions.framePreset, watermarkOptions.opacity);
        }

        if (watermarkOptions && (watermarkOptions.framePreset === 'custom' || watermarkOptions.type === 'image' || watermarkOptions.type === 'both') && watermarkOptions.image) {
          const watermarkImg = new Image();
          watermarkImg.crossOrigin = 'anonymous';
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

        // Draw text overlay if custom image overlay is not active
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

const drawFramePreset = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  presetName: string,
  opacity: number
) => {
  ctx.save();
  ctx.globalAlpha = opacity;

  switch (presetName) {
    case 'polaroid': {
      // Classic Polaroid: White frame border all around, thicker at the bottom.
      const borderSize = Math.round(Math.min(width, height) * 0.045);
      const bottomSpace = Math.round(height * 0.12);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, borderSize);
      ctx.fillRect(0, 0, borderSize, height);
      ctx.fillRect(width - borderSize, 0, borderSize, height);
      ctx.fillRect(0, height - bottomSpace, width, bottomSpace);

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(borderSize, borderSize, width - 2 * borderSize, height - borderSize - bottomSpace);
      break;
    }
    case 'wedding_gold': {
      // Elegant Gold Wedding: Double gold thin borders with elegant royal ornaments and ivory-gold banner
      const pad = Math.round(Math.min(width, height) * 0.03);
      const barH = Math.round(height * 0.20);
      
      // Bottom banner: ivory gold gradient
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(254, 252, 232, 0.90)'); 
      grad.addColorStop(1, 'rgba(253, 224, 71, 0.94)');  
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      // Gold borders
      ctx.strokeStyle = '#d97706'; 
      ctx.lineWidth = 1.5;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);
      ctx.lineWidth = 0.5;
      ctx.strokeRect(pad + 4, pad + 4, width - (pad + 4) * 2, height - (pad + 4) * 2);

      // Corner ornaments
      const drawOrnaments = (x: number, y: number, scaleX: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = 'rgba(180, 83, 9, 0.6)';
        ctx.lineWidth = 1.2;
        
        ctx.beginPath();
        ctx.arc(35, -barH / 2, 16, 0, Math.PI * 1.5, true);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(50, -barH / 2, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      };
      
      drawOrnaments(0, height, 1);
      drawOrnaments(width, height, -1);
      
      // Brand stamp
      ctx.fillStyle = 'rgba(180, 83, 9, 0.45)';
      ctx.font = 'bold 8px "Outfit", sans-serif';
      ctx.fillText("do'i picture", width - 60, height - 15);
      break;
    }
    case 'rose_gold_floral': {
      // Rose Gold Floral (Pink Wedding Frame) - Matches user request guest_photo_inside_1781160122707.png
      const barH = Math.round(height * 0.22);
      
      // Bottom pink-to-rose-gold gradient strip
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(251, 207, 232, 0.84)'); // Soft pink
      grad.addColorStop(0.5, 'rgba(244, 114, 182, 0.88)'); // Vivid pink
      grad.addColorStop(1, 'rgba(219, 39, 119, 0.94)'); // Deep rose
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      // Thin inner white border
      const pad = Math.round(Math.min(width, height) * 0.025);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

      // Draw beautiful white floral line art on left and right sides
      const drawFloralDesign = (cx: number, cy: number, scaleX: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 1.2;

        // Draw flower 1
        const fx1 = 50, fy1 = -barH * 0.5;
        ctx.beginPath();
        ctx.arc(fx1, fy1, 8, 0, Math.PI * 2);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const a = (i * 2 * Math.PI) / 5;
          const px = fx1 + Math.cos(a) * 22;
          const py = fy1 + Math.sin(a) * 22;
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw leaf branch curling outwards
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.beginPath();
        ctx.moveTo(fx1, fy1);
        ctx.quadraticCurveTo(fx1 + 55, fy1 - 55, fx1 + 105, fy1 - 25);
        ctx.stroke();

        for (let t = 0.3; t <= 0.8; t += 0.25) {
          const lx = fx1 + (105 - fx1) * t;
          const ly = fy1 - 32;
          ctx.beginPath();
          ctx.ellipse(lx, ly, 10, 5, Math.PI / 4, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      };

      drawFloralDesign(0, height, 1);
      drawFloralDesign(width, height, -1);

      // Logo brand stamp in bottom-right corner
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.font = 'bold 12px "Outfit", sans-serif';
      ctx.fillText("do'i", width - 24, height - 28);
      ctx.font = '10px "Playfair Display", serif';
      ctx.fillText("picture", width - 24, height - 16);
      ctx.restore();
      break;
    }
    case 'botanical': {
      // Golden Leaf: Organic gold leaves growing from corners and a white glass-morphic banner
      const barH = Math.round(height * 0.18);
      const pad = Math.round(Math.min(width, height) * 0.03);

      // Bottom glass-morphic banner
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillRect(0, height - barH, width, barH);
      
      // Thin golden inner border
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

      const drawLeafBranch = (x: number, y: number, scaleX: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = '#ca8a04';
        ctx.fillStyle = 'rgba(202, 138, 4, 0.2)';
        ctx.lineWidth = 1.5;

        // stem
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(40, -barH * 0.5, 90, -barH * 0.6);
        ctx.stroke();

        // leaves
        const drawLeafNode = (lx: number, ly: number, rot: number) => {
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(rot);
          ctx.beginPath();
          ctx.ellipse(0, 0, 12, 6, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        };

        drawLeafNode(35, -barH * 0.25, -Math.PI / 4);
        drawLeafNode(60, -barH * 0.45, -Math.PI / 4);
        drawLeafNode(85, -barH * 0.58, -Math.PI / 4);
        ctx.restore();
      };

      drawLeafBranch(0, height, 1);
      drawLeafBranch(width, height, -1);
      
      // Brand stamp
      ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
      ctx.font = 'bold 8px "Outfit", sans-serif';
      ctx.fillText("do'i picture", width - 60, height - 15);
      break;
    }
    case 'minimal_black': {
      // Minimalist Editorial Black: Sleek magazine design with black bottom bar & camera metadata
      const pad = Math.round(Math.min(width, height) * 0.025);
      const barH = Math.round(height * 0.15);

      // Bottom black banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, height - barH, width, barH);

      // Border
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.strokeRect(pad, pad, width - pad * 2, height - pad * 2);

      // Editorial details
      ctx.fillStyle = '#f8fafc';
      ctx.font = '8px monospace';
      ctx.fillText("do'ipicture EDITORIAL // SERIES A", 24, height - 18);
      ctx.fillText("ISO 400  F/2.8  1/125s", width - 130, height - 18);
      break;
    }
    case 'retro_film': {
      // Retro Film 35mm: Black film strip top and bottom with sprocket holes.
      const barHeight = Math.round(height * 0.09);
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, barHeight);
      ctx.fillRect(0, height - barHeight, width, barHeight);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      const holeW = Math.round(width * 0.015);
      const holeH = Math.round(barHeight * 0.35);
      const gap = Math.round(holeW * 1.8);
      const startYTop = Math.round(barHeight * 0.3);
      const startYBot = height - barHeight + Math.round(barHeight * 0.3);

      for (let x = gap; x < width - gap; x += holeW + gap) {
        ctx.fillRect(x, startYTop, holeW, holeH);
        ctx.fillRect(x, startYBot, holeW, holeH);
      }

      ctx.fillStyle = '#eab308';
      ctx.font = `bold ${Math.round(barHeight * 0.25)}px monospace`;
      ctx.fillText("do'ipicture FX-400", 20, barHeight + 12);
      break;
    }
    case 'midnight_luxury': {
      // Midnight Luxury: Deep navy gradient at the bottom with gold geometric overlapping lines
      const barHeight = Math.round(height * 0.22);
      const grad = ctx.createLinearGradient(0, height - barHeight, 0, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0)');
      grad.addColorStop(0.4, 'rgba(15, 23, 42, 0.55)');
      grad.addColorStop(1, 'rgba(8, 15, 30, 0.92)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barHeight, width, barHeight);

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.25, height - barHeight * 0.5);
      ctx.lineTo(width * 0.5, height);
      ctx.moveTo(width * 0.5, height);
      ctx.lineTo(width * 0.75, height - barHeight * 0.5);
      ctx.lineTo(width, height);
      ctx.stroke();
      break;
    }
    case 'neon_glow': {
      // Neon Glow: Cyberpunk cyan and magenta neon glowing horizontal bars
      const glowHeight = Math.round(height * 0.012);
      
      ctx.save();
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(0, 0, width, glowHeight);
      ctx.restore();

      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, height - glowHeight, width, glowHeight);
      ctx.restore();
      break;
    }
    case 'soft_vignette': {
      // Soft Vignette: Cream/White fuzzy radial vignette
      const vignette = ctx.createRadialGradient(
        width / 2, height / 2, Math.min(width, height) * 0.4,
        width / 2, height / 2, Math.max(width, height) * 0.65
      );
      vignette.addColorStop(0, 'rgba(255, 255, 255, 0)');
      vignette.addColorStop(0.85, 'rgba(255, 255, 255, 0.2)');
      vignette.addColorStop(1, 'rgba(255, 255, 255, 0.65)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
      break;
    }
    case 'silver_sparkles': {
      // Silver Sparkles: Silver gradient border on the bottom with starry sparkles
      const barH = Math.round(height * 0.15);
      const sGrad = ctx.createLinearGradient(0, height - barH, 0, height);
      sGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
      sGrad.addColorStop(0.5, 'rgba(226, 232, 240, 0.4)');
      sGrad.addColorStop(1, 'rgba(148, 163, 184, 0.7)');

      ctx.fillStyle = sGrad;
      ctx.fillRect(0, height - barH, width, barH);

      const drawStar = (cx: number, cy: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(cx, cy - r);
        ctx.lineTo(cx + r * 0.2, cy - r * 0.2);
        ctx.lineTo(cx + r, cy);
        ctx.lineTo(cx + r * 0.2, cy + r * 0.2);
        ctx.lineTo(cx, cy + r);
        ctx.lineTo(cx - r * 0.2, cy + r * 0.2);
        ctx.lineTo(cx - r, cy);
        ctx.lineTo(cx - r * 0.2, cy - r * 0.2);
        ctx.closePath();
        ctx.fillStyle = '#ffffff';
        ctx.fill();
      };

      drawStar(width * 0.12, height - barH * 0.4, 5);
      drawStar(width * 0.88, height - barH * 0.5, 7);
      drawStar(width * 0.92, height - barH * 0.25, 4);
      break;
    }
    case 'vintage_paper': {
      // Vintage Parchment: A warm cream background border all around with a distressed inner border.
      const borderSize = Math.round(Math.min(width, height) * 0.05);
      
      // Cream paper background border
      ctx.fillStyle = '#fbf0d9';
      ctx.fillRect(0, 0, width, borderSize);
      ctx.fillRect(0, 0, borderSize, height);
      ctx.fillRect(width - borderSize, 0, borderSize, height);
      ctx.fillRect(0, height - borderSize, width, borderSize);

      // Distressed brown inner border
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(borderSize - 2, borderSize - 2, width - (borderSize - 2) * 2, height - (borderSize - 2) * 2);
      
      // Draw corner accents
      ctx.fillStyle = '#854d0e';
      const cornerSize = 8;
      ctx.fillRect(borderSize - 5, borderSize - 5, cornerSize, cornerSize);
      ctx.fillRect(width - borderSize - 3, borderSize - 5, cornerSize, cornerSize);
      ctx.fillRect(borderSize - 5, height - borderSize - 3, cornerSize, cornerSize);
      ctx.fillRect(width - borderSize - 3, height - borderSize - 3, cornerSize, cornerSize);
      break;
    }
    case 'cyberpunk_grid': {
      // Cyberpunk HUD: Electric blue corner brackets and targeting overlay lines.
      const pad = Math.round(Math.min(width, height) * 0.04);
      const neonBlue = '#06b6d4';
      ctx.strokeStyle = neonBlue;
      ctx.lineWidth = 2;

      // Draw brackets
      const len = 30;
      // top-left
      ctx.beginPath();
      ctx.moveTo(pad + len, pad); ctx.lineTo(pad, pad); ctx.lineTo(pad, pad + len);
      ctx.stroke();
      // top-right
      ctx.beginPath();
      ctx.moveTo(width - pad - len, pad); ctx.lineTo(width - pad, pad); ctx.lineTo(width - pad, pad + len);
      ctx.stroke();
      // bottom-left
      ctx.beginPath();
      ctx.moveTo(pad + len, height - pad); ctx.lineTo(pad, height - pad); ctx.lineTo(pad, height - pad + len);
      ctx.stroke();
      // bottom-right
      ctx.beginPath();
      ctx.moveTo(width - pad - len, height - pad); ctx.lineTo(width - pad, height - pad); ctx.lineTo(width - pad, height - pad + len);
      ctx.stroke();

      // Technical crosshairs in the corners
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad + 10, pad + 10); ctx.lineTo(pad + 10, pad + 25);
      ctx.moveTo(pad + 10, pad + 10); ctx.lineTo(pad + 25, pad + 10);
      ctx.stroke();

      ctx.fillStyle = neonBlue;
      ctx.font = '8px monospace';
      ctx.fillText('REC // SYSTEM ACTIVE', pad + 40, pad + 12);
      break;
    }
    case 'cherry_blossom': {
      // Cherry Blossom Sakura: Soft pink/cream gradient bottom banner with scattered blossoms
      const barH = Math.round(height * 0.18);
      
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(253, 242, 248, 0.85)'); 
      grad.addColorStop(1, 'rgba(251, 207, 232, 0.92)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      ctx.strokeStyle = '#f472b6';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      const drawPetal = (cx: number, cy: number, rot: number, r: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        ctx.fillStyle = '#fbcfe8'; // soft pink
        ctx.strokeStyle = '#f472b6'; // rose pink
        ctx.lineWidth = 0.5;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, r, r * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      };

      // Corner petal groups
      drawPetal(30, height - barH * 0.5, Math.PI / 6, 8);
      drawPetal(45, height - barH * 0.6, Math.PI / 4, 6);
      drawPetal(width - 50, height - barH * 0.5, Math.PI / 3, 7);
      drawPetal(width - 35, height - barH * 0.4, -Math.PI / 8, 9);
      break;
    }
    case 'luxury_marble': {
      // Luxury Marble: Dark graphite border with scattered golden veins.
      const borderSize = Math.round(Math.min(width, height) * 0.045);
      
      // Graphite border
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, width, borderSize);
      ctx.fillRect(0, 0, borderSize, height);
      ctx.fillRect(width - borderSize, 0, borderSize, height);
      ctx.fillRect(0, height - borderSize, width, borderSize);

      // Gold veins
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // vein 1 top left
      ctx.moveTo(0, borderSize * 0.5);
      ctx.lineTo(borderSize * 3, borderSize * 0.2);
      ctx.lineTo(borderSize * 4, borderSize * 0.8);
      ctx.stroke();

      // vein 2 bottom right
      ctx.beginPath();
      ctx.moveTo(width - borderSize * 3, height - borderSize * 0.8);
      ctx.lineTo(width - borderSize * 1.5, height - borderSize * 0.2);
      ctx.lineTo(width, height - borderSize * 0.5);
      ctx.stroke();

      // Inner gold frame line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(borderSize + 2, borderSize + 2, width - (borderSize + 2) * 2, height - (borderSize + 2) * 2);
      break;
    }
    case 'christmas_holiday': {
      // Christmas Holiday: Evergreen pine needles and bright red holly berries in corners and red bottom banner
      const barH = Math.round(height * 0.18);
      
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(220, 38, 38, 0.85)'); 
      grad.addColorStop(1, 'rgba(127, 29, 29, 0.92)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.2;
      ctx.strokeRect(10, 10, width - 20, height - 20);

      const drawPineBranch = (x: number, y: number, rot: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rot);
        ctx.strokeStyle = '#065f46'; // dark green
        ctx.lineWidth = 1.5;

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(35, 0);
        ctx.stroke();

        ctx.lineWidth = 0.8;
        for (let i = 0; i < 30; i += 3) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i - 4, 6);
          ctx.moveTo(i, 0);
          ctx.lineTo(i - 4, -6);
          ctx.stroke();
        }

        // Red berries
        ctx.fillStyle = '#dc2626'; 
        ctx.beginPath();
        ctx.arc(5, 3, 3, 0, Math.PI * 2);
        ctx.arc(8, -2, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawPineBranch(15, height - barH * 0.5, Math.PI / 4);
      drawPineBranch(width - 15, height - barH * 0.5, -(Math.PI * 3) / 4);
      break;
    }
    default:
      break;
  }

  ctx.restore();
};
