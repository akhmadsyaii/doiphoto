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
  // Per-line text and font overrides
  textLine1?: string;
  textLine2?: string;
  textLine3?: string;
  fontLine1?: string;
  fontLine2?: string;
  fontLine3?: string;
}

const getBottomBannerHeight = (preset: string, height: number): number => {
  switch (preset) {
    case 'polaroid':
      return Math.round(height * 0.15);
    case 'wedding_gold':
      return Math.round(height * 0.18);
    case 'botanical':
      return Math.round(height * 0.18);
    case 'minimal_black':
      return Math.round(height * 0.15);
    case 'retro_film':
      return Math.round(height * 0.14);
    case 'midnight_luxury':
      return Math.round(height * 0.20);
    case 'neon_glow':
      return Math.round(height * 0.15);
    case 'soft_vignette':
      return Math.round(height * 0.18);
    case 'silver_sparkles':
      return Math.round(height * 0.16);
    case 'rose_gold_floral':
      return Math.round(height * 0.35);
    case 'vintage_paper':
      return Math.round(height * 0.18);
    case 'cyberpunk_grid':
      return Math.round(height * 0.16);
    case 'cherry_blossom':
      return Math.round(height * 0.18);
    case 'luxury_marble':
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
          if (watermarkOptions && (watermarkOptions.type === 'text' || watermarkOptions.type === 'both')) {
            // Check if per-line mode is active
            const hasPerLineText = !!(
              watermarkOptions.textLine1 || watermarkOptions.textLine2 || watermarkOptions.textLine3
            );

            // Build lines array
            const lines: string[] = hasPerLineText
              ? [
                  watermarkOptions.textLine1 || '',
                  watermarkOptions.textLine2 || '',
                  watermarkOptions.textLine3 || ''
                ].filter(l => l.trim() !== '')
              : (watermarkOptions.text || '').split('\n').filter(l => l.trim() !== '');

            if (lines.length === 0) return;

            ctx.save();
            const wSize = watermarkOptions.size || 20;
            const wOpacity = watermarkOptions.opacity !== undefined ? watermarkOptions.opacity : 0.8;
            // Default (legacy) font
            const wFont = watermarkOptions.font || 'Outfit';
            const fLine1 = watermarkOptions.fontLine1 || wFont;
            const fLine2 = watermarkOptions.fontLine2 || wFont;
            const fLine3 = watermarkOptions.fontLine3 || wFont;

            const bannerH = getBottomBannerHeight(watermarkOptions.framePreset || '', height);

            // Determine text color based on frame preset
            let textColor: string;
            let shadowColor: string;
            let shadowBlur: number;

            const preset = watermarkOptions.framePreset || '';
            const isLightPreset = [
              'polaroid', 'wedding_gold', 'botanical',
              'silver_sparkles', 'vintage_paper', 'cherry_blossom'
            ].includes(preset);

            if (isLightPreset) {
              if (preset === 'polaroid') {
                textColor = `rgba(30, 41, 59, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.5)';
              } else if (preset === 'wedding_gold') {
                textColor = `rgba(120, 53, 15, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.4)';
              } else if (preset === 'botanical') {
                textColor = `rgba(20, 83, 45, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.4)';
              } else if (preset === 'cherry_blossom') {
                textColor = `rgba(219, 39, 119, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.5)';
              } else if (preset === 'vintage_paper') {
                textColor = `rgba(69, 26, 3, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.3)';
              } else {
                textColor = `rgba(30, 41, 59, ${wOpacity})`;
                shadowColor = 'rgba(255, 255, 255, 0.5)';
              }
              shadowBlur = 2;
            } else {
              if (preset === 'neon_glow' || preset === 'cyberpunk_grid') {
                textColor = `rgba(34, 211, 238, ${wOpacity})`;
                shadowColor = 'rgba(6, 182, 212, 0.5)';
              } else {
                textColor = `rgba(255, 255, 255, ${wOpacity})`;
                shadowColor = 'rgba(0, 0, 0, 0.6)';
              }
              shadowBlur = 6;
            }

            ctx.fillStyle = textColor;
            ctx.shadowColor = shadowColor;
            ctx.shadowBlur = shadowBlur;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 1;

            const isScript = (f: string) =>
              ['Sacramento', 'Great Vibes', 'Alex Brush', 'Pacifico'].includes(f);

            if (bannerH > 0) {
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const centerY = height - bannerH / 2;

              if (lines.length === 1) {
                const f = hasPerLineText ? fLine1 : fLine2;
                ctx.font = `${isScript(f) ? '' : 'bold '}${wSize}px '${f}', sans-serif`;
                ctx.fillText(lines[0], width / 2, centerY);
              } else if (lines.length === 2) {
                // Line 1
                const f1 = hasPerLineText ? fLine1 : fLine1;
                ctx.font = `${isScript(f1) ? '' : 'bold '}${Math.round(wSize * 0.55)}px '${f1}', sans-serif`;
                ctx.fillText(lines[0], width / 2, centerY - wSize * 0.55);
                // Line 2: main script/names
                const f2 = hasPerLineText ? fLine2 : wFont;
                ctx.font = `${isScript(f2) ? '' : 'bold '}${wSize}px '${f2}', sans-serif`;
                ctx.fillText(lines[1], width / 2, centerY + wSize * 0.05);
              } else {
                // Line 1: small title label
                const f1 = hasPerLineText ? fLine1 : (isLightPreset ? 'Outfit' : 'sans-serif');
                ctx.font = `${isScript(f1) ? '' : 'bold '}${Math.round(wSize * 0.45)}px '${f1}', sans-serif`;
                ctx.fillText(lines[0], width / 2, centerY - wSize * 0.7);
                // Line 2: main script names
                const f2 = hasPerLineText ? fLine2 : wFont;
                ctx.font = `${isScript(f2) ? '' : 'bold '}${wSize}px '${f2}', sans-serif`;
                ctx.fillText(lines[1], width / 2, centerY + wSize * 0.05);
                // Line 3: date
                const f3 = hasPerLineText ? fLine3 : (isLightPreset ? 'Outfit' : 'sans-serif');
                ctx.font = `${isScript(f3) ? '' : 'bold '}${Math.round(wSize * 0.42)}px '${f3}', sans-serif`;
                ctx.fillText(lines[2], width / 2, centerY + wSize * 0.75);
              }

              // Brand stamp: "Do'i" and "picture" styled elegantly in the bottom-right of the banner
              ctx.save();
              ctx.textAlign = 'right';
              ctx.textBaseline = 'alphabetic';
              const stampOpacity = wOpacity * 0.78;
              const stampColor = isLightPreset
                ? `rgba(30, 41, 59, ${stampOpacity})`
                : `rgba(255, 255, 255, ${stampOpacity})`;
              ctx.fillStyle = stampColor;
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              // Do'i text: bold serif/sans font
              const doiSize = Math.max(16, Math.round(bannerH * 0.17));
              ctx.font = `bold ${doiSize}px 'Outfit', sans-serif`;
              ctx.fillText("Do'i", width - 24, height - Math.round(bannerH * 0.26));
              
              // picture text: regular small sans
              const picSize = Math.max(10, Math.round(bannerH * 0.10));
              ctx.font = `normal ${picSize}px 'Inter', sans-serif`;
              ctx.fillText("picture", width - 24, height - Math.round(bannerH * 0.13));
              ctx.restore();
            } else {
              // No banner: draw all lines stacked in bottom-right corner
              ctx.textAlign = 'right';
              ctx.textBaseline = 'bottom';
              ctx.fillStyle = `rgba(255, 255, 255, ${wOpacity})`;
              ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
              ctx.shadowBlur = 6;
              ctx.shadowOffsetX = 1;
              ctx.shadowOffsetY = 1;
              const lineH = wSize * 1.25;
              const startY = height - 24 - (lines.length - 1) * lineH;
              lines.forEach((line, i) => {
                const f = i === 0 ? fLine1 : i === 1 ? fLine2 : fLine3;
                ctx.font = `${isScript(f) ? '' : 'bold '}${i === 1 ? wSize : Math.round(wSize * 0.7)}px '${f}', sans-serif`;
                ctx.fillText(line, width - 24, startY + i * lineH);
              });
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
      const barH = Math.round(height * 0.15);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
      ctx.fillRect(0, height - barH, width, barH);
      
      // subtle top boundary line
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();
      break;
    }
    case 'wedding_gold': {
      const barH = Math.round(height * 0.18);
      
      // Bottom banner: ivory gold gradient, slightly transparent
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(255, 254, 246, 0.85)'); 
      grad.addColorStop(1, 'rgba(252, 244, 220, 0.92)');  
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      // Gold top border and double lines
      ctx.strokeStyle = 'rgba(194, 120, 3, 0.85)'; 
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.moveTo(0, height - barH + 4);
      ctx.lineTo(width, height - barH + 4);
      ctx.stroke();

      // Classic baroque scrollwork corner ornaments
      const drawOrnaments = (x: number, y: number, scaleX: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = 'rgba(194, 120, 3, 0.75)';
        ctx.lineWidth = 1.2;
        
        // Concentric elegant border frame line
        ctx.beginPath();
        ctx.moveTo(12, 0);
        ctx.lineTo(12, -barH + 12);
        ctx.quadraticCurveTo(12, -barH + 12, 24, -barH + 12);
        ctx.lineTo(width * 0.22, -barH + 12);
        ctx.stroke();
        
        // Baroque flourish curl 1
        ctx.beginPath();
        ctx.arc(32, -barH + 26, 9, Math.PI, Math.PI * 2.4);
        ctx.stroke();
        
        // Baroque flourish curl 2
        ctx.beginPath();
        ctx.arc(58, -barH + 26, 5, 0, Math.PI * 1.8);
        ctx.stroke();
        
        // Tiny gold leaf detail
        ctx.beginPath();
        ctx.moveTo(42, -barH + 26);
        ctx.quadraticCurveTo(48, -barH + 18, 54, -barH + 20);
        ctx.quadraticCurveTo(48, -barH + 28, 42, -barH + 26);
        ctx.fillStyle = 'rgba(194, 120, 3, 0.25)';
        ctx.fill();
        ctx.stroke();
        
        // Small gold diamond accent in center of dividing line
        ctx.fillStyle = 'rgba(194, 120, 3, 0.9)';
        ctx.beginPath();
        ctx.moveTo(width * 0.11, -barH + 12);
        ctx.lineTo(width * 0.11 + 5, -barH + 7);
        ctx.lineTo(width * 0.11 + 10, -barH + 12);
        ctx.lineTo(width * 0.11 + 5, -barH + 17);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
      };
      
      drawOrnaments(0, height, 1);
      drawOrnaments(width, height, -1);
      break;
    }
    case 'rose_gold_floral': {
      // ── ELEGANT ROSE FLORAL WEDDING BANNER ──
      // Matches reference: large bottom banner, seamless vignette, detailed floral art
      const barH = Math.round(height * 0.35);
      const bannerTop = height - barH;

      // 1. Seamless vignette from photo to banner (smooth transition)
      const fadeGrad = ctx.createLinearGradient(0, bannerTop - barH * 0.25, 0, bannerTop + barH * 0.15);
      fadeGrad.addColorStop(0, 'rgba(186, 68, 102, 0)');
      fadeGrad.addColorStop(1, 'rgba(186, 68, 102, 0.65)');
      ctx.fillStyle = fadeGrad;
      ctx.fillRect(0, bannerTop - Math.round(barH * 0.25), width, Math.round(barH * 0.4));

      // 2. Main banner body gradient (deep rose to darker pink)
      const bannerGrad = ctx.createLinearGradient(0, bannerTop, 0, height);
      bannerGrad.addColorStop(0,   'rgba(202, 59, 102, 0.70)');
      bannerGrad.addColorStop(0.4, 'rgba(186, 45,  85, 0.85)');
      bannerGrad.addColorStop(1,   'rgba(148, 25,  60, 0.95)');
      ctx.fillStyle = bannerGrad;
      ctx.fillRect(0, bannerTop, width, barH);

      // 3. Subtle horizontal sheen line at banner top
      ctx.save();
      ctx.globalAlpha = 0.18;
      const sheenGrad = ctx.createLinearGradient(0, bannerTop, width, bannerTop);
      sheenGrad.addColorStop(0,   'transparent');
      sheenGrad.addColorStop(0.3, 'rgba(255,255,255,0.6)');
      sheenGrad.addColorStop(0.7, 'rgba(255,255,255,0.6)');
      sheenGrad.addColorStop(1,   'transparent');
      ctx.fillStyle = sheenGrad;
      ctx.fillRect(0, bannerTop, width, 2);
      ctx.restore();

      // ── FLORAL DRAWING PROCEDURES ──
      const drawDetailedFlower = (
        cx: number, cy: number,
        r: number, rotation: number,
        strokeColor: string, fillColor: string,
        lw: number
      ) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        
        // 5 wavy petals
        for (let p = 0; p < 5; p++) {
          const angle = (p * Math.PI * 2) / 5;
          ctx.save();
          ctx.rotate(angle);
          
          ctx.strokeStyle = strokeColor;
          ctx.fillStyle = fillColor;
          ctx.lineWidth = lw;
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-r * 0.45, -r * 0.25, -r * 0.55, -r * 0.75, -r * 0.25, -r * 0.95);
          ctx.bezierCurveTo(-r * 0.12, -r * 1.05, r * 0.12, -r * 1.05, r * 0.25, -r * 0.95);
          ctx.bezierCurveTo(r * 0.55, -r * 0.75, r * 0.45, -r * 0.25, 0, 0);
          ctx.fill();
          ctx.stroke();
          
          // Internal petal vein lines
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = lw * 0.65;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(0, -r * 0.5, 0, -r * 0.85);
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(-r * 0.15, -r * 0.45, -r * 0.18, -r * 0.75);
          ctx.moveTo(0, 0);
          ctx.quadraticCurveTo(r * 0.15, -r * 0.45, r * 0.18, -r * 0.75);
          ctx.stroke();
          
          ctx.restore();
        }
        
        // Central stamens
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = lw * 0.6;
        for (let s = 0; s < 10; s++) {
          const sa = (s * Math.PI * 2) / 10;
          const len = r * 0.38;
          const targetX = Math.cos(sa) * len;
          const targetY = Math.sin(sa) * len;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(targetX, targetY);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.arc(targetX, targetY, r * 0.045, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fill();
        }
        
        // Center glow
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();
        
        ctx.restore();
      };

      const drawDetailedLeaf = (
        x1: number, y1: number,
        x2: number, y2: number,
        cpx: number, cpy: number,
        strokeColor: string, fillColor: string,
        lw: number
      ) => {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lw;
        ctx.fillStyle = fillColor;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) {
          ctx.restore();
          return;
        }
        const nx = -dy / len;
        const ny = dx / len;
        
        const thickness = len * 0.20;
        const cx1 = cpx + nx * thickness;
        const cy1 = cpy + ny * thickness;
        const cx2 = cpx - nx * thickness;
        const cy2 = cpy - ny * thickness;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cx1, cy1, x2, y2);
        ctx.quadraticCurveTo(cx2, cy2, x1, y1);
        ctx.fill();
        ctx.stroke();
        
        // Midrib
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(cpx, cpy, x2, y2);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.stroke();
        
        // Sub-veins
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = lw * 0.5;
        const numVeins = 3;
        for (let i = 1; i <= numVeins; i++) {
          const t = i / (numVeins + 1);
          const mt = 1 - t;
          const rx = mt * mt * x1 + 2 * mt * t * cpx + t * t * x2;
          const ry = mt * mt * y1 + 2 * mt * t * cpy + t * t * y2;
          
          const dxt = 2 * (1 - t) * (cpx - x1) + 2 * t * (x2 - cpx);
          const dyt = 2 * (1 - t) * (cpy - y1) + 2 * t * (y2 - cpy);
          const lent = Math.sqrt(dxt * dxt + dyt * dyt);
          if (lent > 0) {
            const nxt = -dyt / lent;
            const nyt = dxt / lent;
            const currentThick = thickness * (1 - t * 0.6);
            
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + (nxt * 0.8 + dxt/lent * 0.4) * currentThick, ry + (nyt * 0.8 + dyt/lent * 0.4) * currentThick);
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - (nxt * 0.8 - dxt/lent * 0.4) * currentThick, ry - (nyt * 0.8 - dyt/lent * 0.4) * currentThick);
            ctx.stroke();
          }
        }
        
        ctx.restore();
      };

      const drawTendril = (
        sx: number, sy: number,
        cpx1: number, cpy1: number,
        cpx2: number, cpy2: number,
        ex: number, ey: number,
        strokeColor: string,
        lw: number
      ) => {
        ctx.save();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lw;
        
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, ex, ey);
        ctx.stroke();
        
        // Spiral
        ctx.beginPath();
        let cx = ex;
        let cy = ey;
        let r = Math.min(width, height) * 0.015;
        let angle = Math.atan2(ey - cpy2, ex - cpx2);
        ctx.moveTo(cx, cy);
        for (let i = 0; i < 20; i++) {
          angle += 0.25;
          r *= 0.90;
          const px = ex + Math.cos(angle) * (Math.min(width, height) * 0.018 - r);
          const py = ey + Math.sin(angle) * (Math.min(width, height) * 0.018 - r);
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      };

      // ── DRAW ONE FULL FLORAL CLUSTER ──
      const drawFloralCluster = (originX: number, originY: number, scaleX: number) => {
        ctx.save();
        ctx.translate(originX, originY);
        ctx.scale(scaleX, 1);

        const fw = width * 0.24;  // cluster width
        const fh = barH * 1.1;   // cluster height

        const lineWhite = 'rgba(255, 255, 255, 0.88)';
        const fillPink  = 'rgba(255, 230, 240, 0.16)';
        const stemColor = 'rgba(255, 255, 255, 0.55)';
        const lw1 = Math.max(1, width * 0.0012);
        const lw2 = Math.max(0.7, width * 0.0008);

        // 1. STEMS & CURVING BRANCHES
        drawTendril(0, 0, fw * 0.15, -fh * 0.25, fw * 0.35, -fh * 0.55, fw * 0.65, -fh * 0.68, stemColor, lw1 * 0.8);
        drawTendril(fw * 0.25, -fh * 0.35, fw * 0.38, -fh * 0.52, fw * 0.52, -fh * 0.65, fw * 0.8, -fh * 0.72, stemColor, lw1 * 0.7);
        drawTendril(0, -fh * 0.05, fw * 0.1, -fh * 0.2, fw * 0.12, -fh * 0.28, fw * 0.22, -fh * 0.35, stemColor, lw2);

        // 2. LARGE FLOWERS
        // Large Center Flower
        drawDetailedFlower(fw * 0.38, -fh * 0.42, fw * 0.24, -Math.PI / 8, lineWhite, fillPink, lw1);
        // Medium Upper-Right Flower
        drawDetailedFlower(fw * 0.7, -fh * 0.7, fw * 0.16, Math.PI / 6, lineWhite, fillPink, lw1 * 0.9);
        // Bud Flower
        drawDetailedFlower(fw * 0.16, -fh * 0.22, fw * 0.11, -Math.PI / 4, lineWhite, fillPink, lw2);

        // 3. ELEGANT LANCEOLATE LEAVES
        // Leaf 1: Bottom Outer
        drawDetailedLeaf(fw * 0.02, -fh * 0.05, fw * 0.22, -fh * 0.12, fw * 0.10, -fh * 0.04, lineWhite, fillPink, lw1);
        // Leaf 2: Lower Inner
        drawDetailedLeaf(fw * 0.12, -fh * 0.22, fw * 0.02, -fh * 0.44, fw * 0.04, -fh * 0.33, lineWhite, fillPink, lw1);
        // Leaf 3: Center Mid
        drawDetailedLeaf(fw * 0.28, -fh * 0.32, fw * 0.18, -fh * 0.58, fw * 0.20, -fh * 0.45, lineWhite, fillPink, lw1);
        // Leaf 4: Center Upper
        drawDetailedLeaf(fw * 0.48, -fh * 0.48, fw * 0.68, -fh * 0.42, fw * 0.58, -fh * 0.42, lineWhite, fillPink, lw2);
        // Leaf 5: Upper Mid
        drawDetailedLeaf(fw * 0.62, -fh * 0.64, fw * 0.52, -fh * 0.86, fw * 0.54, -fh * 0.75, lineWhite, fillPink, lw1);
        // Leaf 6: Topmost Outer
        drawDetailedLeaf(fw * 0.72, -fh * 0.72, fw * 0.88, -fh * 0.62, fw * 0.80, -fh * 0.65, lineWhite, fillPink, lw2);

        // 4. SCATTERED DEW DROP SPARKLES
        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        const dots = [
          { x: fw * 0.28, y: -fh * 0.08, r: fw * 0.015 },
          { x: fw * 0.45, y: -fh * 0.22, r: fw * 0.012 },
          { x: fw * 0.58, y: -fh * 0.12, r: fw * 0.018 },
          { x: fw * 0.82, y: -fh * 0.48, r: fw * 0.013 },
          { x: fw * 0.15, y: -fh * 0.62, r: fw * 0.010 },
        ];
        dots.forEach(d => {
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();

        ctx.restore();
      };

      // Draw left cluster and mirrored right cluster
      drawFloralCluster(0, height, 1);
      drawFloralCluster(width, height, -1);

      break;
    }
    case 'botanical': {
      // Golden Leaf: Organic gold leaves growing from corners and a white glass-morphic banner
      const barH = Math.round(height * 0.18);

      // Bottom glass-morphic banner
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(244, 252, 244, 0.82)'); 
      grad.addColorStop(1, 'rgba(230, 248, 234, 0.90)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);
      
      // Top gold dividing line
      ctx.strokeStyle = 'rgba(180, 120, 4, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();

      const drawLeafBranch = (x: number, y: number, scaleX: number) => {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = '#ca8a04';
        ctx.fillStyle = 'rgba(202, 138, 4, 0.12)';
        ctx.lineWidth = 1.5;

        // stem
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.quadraticCurveTo(35, -barH * 0.45, 85, -barH * 0.55);
        ctx.stroke();

        // leaves with veins
        const drawLeafNode = (lx: number, ly: number, rot: number, r: number) => {
          ctx.save();
          ctx.translate(lx, ly);
          ctx.rotate(rot);
          ctx.strokeStyle = '#ca8a04';
          ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
          ctx.lineWidth = 1.1;
          
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.quadraticCurveTo(0, -r * 0.42, r, 0);
          ctx.quadraticCurveTo(0, r * 0.42, -r, 0);
          ctx.fill();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(-r, 0);
          ctx.lineTo(r, 0);
          ctx.strokeStyle = 'rgba(202, 138, 4, 0.55)';
          ctx.stroke();
          ctx.restore();
        };

        drawLeafNode(32, -barH * 0.24, -Math.PI / 4, 11);
        drawLeafNode(56, -barH * 0.42, -Math.PI / 4, 9);
        drawLeafNode(78, -barH * 0.53, -Math.PI / 4, 7);
        ctx.restore();
      };

      drawLeafBranch(0, height, 1);
      drawLeafBranch(width, height, -1);
      break;
    }
    case 'minimal_black': {
      // Minimalist Editorial Black: Sleek magazine design with black bottom bar & camera metadata
      const barH = Math.round(height * 0.15);

      // Bottom black banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, height - barH, width, barH);

      // Fine white line at top
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();

      // Editorial details
      ctx.fillStyle = 'rgba(248, 250, 252, 0.6)';
      ctx.font = `${Math.round(barH * 0.18)}px monospace`;
      ctx.fillText("do'ipicture EDITORIAL // SERIES A", 24, height - barH * 0.35);
      ctx.fillText("ISO 400  F/2.8  1/125s", width - 180, height - barH * 0.35);
      break;
    }
    case 'retro_film': {
      // Retro Film 35mm: Black film strip top and bottom with sprocket holes.
      const barH = Math.round(height * 0.14);
      ctx.fillStyle = 'rgba(9, 9, 11, 0.88)';
      ctx.fillRect(0, height - barH, width, barH);

      // Film sprocket holes along the bottom strip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      const holeW = Math.round(width * 0.015);
      const holeH = Math.round(barH * 0.28);
      const gap = Math.round(holeW * 2);
      
      for (let x = gap; x < width - gap; x += holeW + gap) {
        ctx.fillRect(x, height - barH + Math.round(barH * 0.12), holeW, holeH);
        ctx.fillRect(x, height - Math.round(barH * 0.4), holeW, holeH);
      }

      ctx.fillStyle = '#eab308';
      ctx.font = `bold ${Math.round(barH * 0.22)}px monospace`;
      ctx.fillText("do'ipicture SAFETY FILM 400", gap, height - barH * 0.5);
      ctx.fillText("▶ 12A", width - gap - 60, height - barH * 0.5);
      break;
    }
    case 'midnight_luxury': {
      // Midnight Luxury: Deep navy gradient at the bottom with gold geometric overlapping lines
      const barH = Math.round(height * 0.20);
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(15, 23, 42, 0.72)');
      grad.addColorStop(0.5, 'rgba(15, 23, 42, 0.82)');
      grad.addColorStop(1, 'rgba(8, 15, 30, 0.90)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      ctx.strokeStyle = 'rgba(234, 179, 8, 0.45)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      
      // left side geom
      ctx.moveTo(0, height);
      ctx.lineTo(width * 0.2, height - barH * 0.6);
      ctx.lineTo(width * 0.4, height);
      
      // right side geom
      ctx.moveTo(width * 0.6, height);
      ctx.lineTo(width * 0.8, height - barH * 0.6);
      ctx.lineTo(width, height);
      ctx.stroke();
      break;
    }
    case 'neon_glow': {
      // Neon Glow: Cyberpunk cyan and magenta neon glowing horizontal bars
      const barH = Math.round(height * 0.15);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.80)';
      ctx.fillRect(0, height - barH, width, barH);

      // Top glowing magenta neon strip
      ctx.save();
      ctx.shadowColor = '#d946ef';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#f472b6';
      ctx.fillRect(0, height - barH, width, 2);
      ctx.restore();

      // Bottom glowing cyan neon strip
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(0, height - 2, width, 2);
      ctx.restore();

      // Technical crosshairs
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(20, height - barH * 0.5);
      ctx.lineTo(40, height - barH * 0.5);
      ctx.moveTo(30, height - barH * 0.5 - 10);
      ctx.lineTo(30, height - barH * 0.5 + 10);
      ctx.stroke();
      break;
    }
    case 'soft_vignette': {
      // Sunset Silhouette: Sunset orange to deep purple gradient banner
      const barH = Math.round(height * 0.18);
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.72)'); 
      grad.addColorStop(1, 'rgba(147, 51, 234, 0.82)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      // Draw simple white bird silhouettes on the sides
      ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
      const drawBird = (bx: number, by: number) => {
        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(bx + 8, by - 6, bx + 16, by);
        ctx.quadraticCurveTo(bx + 24, by - 6, bx + 32, by);
        ctx.quadraticCurveTo(bx + 24, by - 1, bx + 16, by - 3);
        ctx.quadraticCurveTo(bx + 8, by - 1, bx, by);
        ctx.closePath();
        ctx.fill();
      };
      
      drawBird(width * 0.1, height - barH * 0.6);
      drawBird(width * 0.15, height - barH * 0.45);
      drawBird(width * 0.82, height - barH * 0.7);
      drawBird(width * 0.86, height - barH * 0.5);
      break;
    }
    case 'silver_sparkles': {
      // Silver Sparkles: Silver gradient border on the bottom with starry sparkles
      const barH = Math.round(height * 0.16);
      const sGrad = ctx.createLinearGradient(0, height - barH, 0, height);
      sGrad.addColorStop(0, 'rgba(241, 245, 249, 0.75)');
      sGrad.addColorStop(1, 'rgba(203, 213, 225, 0.84)');
      ctx.fillStyle = sGrad;
      ctx.fillRect(0, height - barH, width, barH);

      // Subtle top divider line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();

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

      drawStar(width * 0.08, height - barH * 0.5, 6);
      drawStar(width * 0.14, height - barH * 0.35, 4);
      drawStar(width * 0.88, height - barH * 0.45, 8);
      drawStar(width * 0.93, height - barH * 0.6, 5);
      break;
    }
    case 'vintage_paper': {
      // Vintage Parchment: Warm paper texture banner with Victorian curl accents
      const barH = Math.round(height * 0.18);
      
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(251, 243, 219, 0.80)'); 
      grad.addColorStop(1, 'rgba(243, 225, 187, 0.88)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      // Distressed brown horizontal lines
      ctx.strokeStyle = 'rgba(133, 77, 14, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(10, height - barH + 5);
      ctx.lineTo(width - 10, height - barH + 5);
      ctx.moveTo(10, height - barH + 9);
      ctx.lineTo(width - 10, height - barH + 9);
      ctx.stroke();
      
      const drawVictorianCurl = (cx: number, cy: number, scaleX: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scaleX, 1);
        ctx.strokeStyle = 'rgba(133, 77, 14, 0.5)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(30, -barH / 2, 8, 0, Math.PI * 1.5, true);
        ctx.stroke();
        ctx.restore();
      };
      
      drawVictorianCurl(0, height, 1);
      drawVictorianCurl(width, height, -1);
      break;
    }
    case 'cyberpunk_grid': {
      // Cyberpunk Grid: Electric grid overlay and targeting lines
      const barH = Math.round(height * 0.16);
      ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      ctx.fillRect(0, height - barH, width, barH);

      // grid line overlay
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.lineWidth = 0.5;
      const gridSize = 12;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, height - barH);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = height - barH; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // brackets
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      const pad = 10;
      const len = 15;
      
      ctx.beginPath();
      ctx.moveTo(pad + len, height - barH + pad);
      ctx.lineTo(pad, height - barH + pad);
      ctx.lineTo(pad, height - barH + pad + len);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width - pad - len, height - barH + pad);
      ctx.lineTo(width - pad, height - barH + pad);
      ctx.lineTo(width - pad, height - barH + pad + len);
      ctx.stroke();
      break;
    }
    case 'cherry_blossom': {
      // Cherry Blossom Sakura: Soft pink/cream gradient bottom banner with scattered blossoms
      const barH = Math.round(height * 0.18);
      
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(255, 241, 242, 0.80)'); 
      grad.addColorStop(1, 'rgba(253, 220, 235, 0.90)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      ctx.strokeStyle = 'rgba(244, 114, 182, 0.65)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();

      const drawSakuraFlower = (cx: number, cy: number, r: number, rot: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rot);
        
        ctx.fillStyle = 'rgba(255, 245, 247, 0.95)';
        ctx.strokeStyle = 'rgba(244, 114, 182, 0.75)';
        ctx.lineWidth = 1;
        
        // 5 notched petals
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI * 2) / 5;
          ctx.save();
          ctx.rotate(angle);
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-r * 0.5, -r * 0.3, -r * 0.6, -r * 0.9, -r * 0.2, -r);
          ctx.lineTo(0, -r * 0.82);
          ctx.lineTo(r * 0.2, -r);
          ctx.bezierCurveTo(r * 0.6, -r * 0.9, r * 0.5, -r * 0.3, 0, 0);
          
          ctx.fill();
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, -r * 0.55);
          ctx.strokeStyle = 'rgba(244, 114, 182, 0.45)';
          ctx.stroke();
          
          ctx.restore();
        }
        
        // Flower center stamens
        ctx.fillStyle = '#db2777';
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.14, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
      };

      drawSakuraFlower(width * 0.08, height - barH * 0.6, 9, Math.PI / 6);
      drawSakuraFlower(width * 0.14, height - barH * 0.38, 6, Math.PI / 4);
      drawSakuraFlower(width * 0.86, height - barH * 0.5, 8, -Math.PI / 8);
      drawSakuraFlower(width * 0.92, height - barH * 0.35, 7, Math.PI / 3);
      break;
    }
    case 'luxury_marble': {
      // Luxury Marble: Slate graphite base with gold veins
      const barH = Math.round(height * 0.18);
      ctx.fillStyle = 'rgba(30, 41, 59, 0.82)';
      ctx.fillRect(0, height - barH, width, barH);

      // Gold veins
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(0, height - barH * 0.4);
      ctx.lineTo(width * 0.15, height - barH * 0.8);
      ctx.lineTo(width * 0.25, height - barH * 0.2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(width * 0.75, height - barH * 0.1);
      ctx.lineTo(width * 0.85, height - barH * 0.7);
      ctx.lineTo(width, height - barH * 0.3);
      ctx.stroke();

      // Top border gold line
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();
      break;
    }
    case 'christmas_holiday': {
      // Christmas Holiday: Evergreen pine needles and holly berries
      const barH = Math.round(height * 0.18);
      
      const grad = ctx.createLinearGradient(0, height - barH, 0, height);
      grad.addColorStop(0, 'rgba(239, 68, 68, 0.76)'); 
      grad.addColorStop(1, 'rgba(185, 28, 28, 0.86)'); 
      ctx.fillStyle = grad;
      ctx.fillRect(0, height - barH, width, barH);

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, height - barH);
      ctx.lineTo(width, height - barH);
      ctx.stroke();

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

        ctx.fillStyle = '#dc2626'; 
        ctx.beginPath();
        ctx.arc(5, 3, 2.5, 0, Math.PI * 2);
        ctx.arc(8, -2, 3, 0, Math.PI * 2);
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
};;
