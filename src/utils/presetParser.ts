export interface ParsedPreset {
  exposure: number;   // -2.0 to 2.0
  contrast: number;   // 0.5 to 1.5
  saturation: number; // 0.0 to 2.0
  brightness: number; // 0.5 to 1.5
  warmth: number;     // -1.0 to 1.0
}

/**
 * Parses Adobe Lightroom preset file content (.xmp or .lrtemplate)
 * and extracts standard color correction values.
 */
export const parseLightroomPreset = (text: string): ParsedPreset => {
  // Defaults
  let exposure = 0;
  let contrast = 1.0;
  let saturation = 1.0;
  let brightness = 1.0;
  let warmth = 0.0;

  // 1. Exposure
  let expMatch = text.match(/crs:Exposure2012="([^"]+)"/i) || text.match(/<crs:Exposure2012>([^<]+)<\/crs:Exposure2012>/i);
  if (!expMatch) {
    expMatch = text.match(/crs:Exposure="([^"]+)"/i) || text.match(/<crs:Exposure>([^<]+)<\/crs:Exposure>/i);
  }
  if (!expMatch) {
    expMatch = text.match(/Exposure2012\s*=\s*([-\d.]+)/i) || text.match(/["']Exposure2012["']\s*=\s*([-\d.]+)/i);
  }
  if (expMatch) {
    const rawVal = parseFloat(expMatch[1]);
    if (!isNaN(rawVal)) {
      exposure = Math.max(-2, Math.min(2, rawVal));
    }
  }

  // 2. Contrast
  let contrastMatch = text.match(/crs:Contrast2012="([^"]+)"/i) || text.match(/<crs:Contrast2012>([^<]+)<\/crs:Contrast2012>/i);
  if (!contrastMatch) {
    contrastMatch = text.match(/crs:Contrast="([^"]+)"/i) || text.match(/<crs:Contrast>([^<]+)<\/crs:Contrast>/i);
  }
  if (!contrastMatch) {
    contrastMatch = text.match(/Contrast2012\s*=\s*([-\d.]+)/i) || text.match(/["']Contrast2012["']\s*=\s*([-\d.]+)/i);
  }
  if (contrastMatch) {
    const rawVal = parseFloat(contrastMatch[1]);
    if (!isNaN(rawVal)) {
      // Lightroom contrast ranges from -100 to 100.
      // Map this to a scale of 0.5 to 1.5 (0 = 1.0 multiplier).
      contrast = 1.0 + (rawVal / 200);
      contrast = Math.max(0.5, Math.min(1.5, contrast));
    }
  }

  // 3. Saturation
  let satMatch = text.match(/crs:Saturation="([^"]+)"/i) || text.match(/<crs:Saturation>([^<]+)<\/crs:Saturation>/i);
  if (!satMatch) {
    satMatch = text.match(/Saturation\s*=\s*([-\d.]+)/i) || text.match(/["']Saturation["']\s*=\s*([-\d.]+)/i);
  }
  if (satMatch) {
    const rawVal = parseFloat(satMatch[1]);
    if (!isNaN(rawVal)) {
      // Lightroom saturation ranges from -100 to 100.
      // Map this to a scale of 0.0 to 2.0 (0 = 1.0 multiplier).
      saturation = 1.0 + (rawVal / 100);
      saturation = Math.max(0.0, Math.min(2.0, saturation));
    }
  }

  // 4. Temperature / Warmth
  let tempMatch = text.match(/crs:Temperature="([^"]+)"/i) || text.match(/<crs:Temperature>([^<]+)<\/crs:Temperature>/i);
  if (!tempMatch) {
    tempMatch = text.match(/Temperature\s*=\s*([-\d.]+)/i) || text.match(/["']Temperature["']\s*=\s*([-\d.]+)/i);
  }
  if (tempMatch) {
    const rawVal = parseFloat(tempMatch[1]);
    if (!isNaN(rawVal)) {
      if (rawVal > 1000) {
        // Absolute Kelvin temperature (neutral daylight is ~5500K).
        // 5500 to 10000 maps to 0.0 to 1.0 warmth. 2000 to 5500 maps to -1.0 to 0.0 cool.
        if (rawVal >= 5500) {
          warmth = (rawVal - 5500) / 4500;
        } else {
          warmth = (rawVal - 5500) / 3500;
        }
      } else {
        // Relative offset temperature -100 to 100.
        warmth = rawVal / 100;
      }
      warmth = Math.max(-1.0, Math.min(1.0, warmth));
    }
  }

  // 5. Highlights
  const highlightsMatch = text.match(/crs:Highlights2012="([^"]+)"/i) || text.match(/Highlights2012\s*=\s*([-\d.]+)/i);
  if (highlightsMatch) {
    const rawVal = parseFloat(highlightsMatch[1]);
    if (!isNaN(rawVal)) {
      // Map highlights slightly into brightness (0.8 to 1.2).
      brightness = 1.0 + (rawVal / 400);
      brightness = Math.max(0.8, Math.min(1.2, brightness));
    }
  }

  return { exposure, contrast, saturation, brightness, warmth };
};
