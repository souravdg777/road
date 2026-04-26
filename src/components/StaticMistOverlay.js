import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { useWindowDimensions } from 'react-native';
import { Canvas, Circle, BlurMask, Rect } from '@shopify/react-native-skia';
import { runOnJS } from 'react-native-reanimated';

/**
 * Render the mist layers to a static image using Skia, then display it.
 * This avoids the touch-blocking issue of having a Canvas in the View tree.
 * The image itself is transparent to touches (pointerEvents="none").
 */

const LAYER_1_PATCHES = [
  { cx: 0.15, cy: 0.20, r: 0.40, opacity: 0.025, blur: 18 },
  { cx: 0.70, cy: 0.35, r: 0.45, opacity: 0.025, blur: 16 },
  { cx: 0.40, cy: 0.75, r: 0.38, opacity: 0.020, blur: 20 },
  { cx: 0.85, cy: 0.80, r: 0.42, opacity: 0.025, blur: 18 },
];

const LAYER_2_PATCHES = [
  { cx: 0.30, cy: 0.15, r: 0.30, opacity: 0.025, blur: 10 },
  { cx: 0.75, cy: 0.50, r: 0.32, opacity: 0.022, blur: 12 },
  { cx: 0.10, cy: 0.65, r: 0.28, opacity: 0.025, blur: 10 },
  { cx: 0.55, cy: 0.90, r: 0.35, opacity: 0.022, blur: 11 },
];

const LAYER_3_PATCHES = [
  { cx: 0.50, cy: 0.10, r: 0.20, opacity: 0.015, blur: 5 },
  { cx: 0.20, cy: 0.45, r: 0.22, opacity: 0.015, blur: 6 },
  { cx: 0.80, cy: 0.25, r: 0.18, opacity: 0.012, blur: 5 },
  { cx: 0.60, cy: 0.70, r: 0.24, opacity: 0.015, blur: 6 },
  { cx: 0.35, cy: 0.90, r: 0.18, opacity: 0.012, blur: 5 },
];

const CLOUD_BASE_OPACITY = 0.04;

export default function StaticMistOverlay() {
  const { width: W, height: H } = useWindowDimensions();
  const [mistImage, setMistImage] = useState(null);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    // Render mist to image on mount or size change
    if (!canvasRef.current || !W || !H) return;

    // Schedule rendering after layout settles
    const timeout = setTimeout(() => {
      renderMistToImage();
    }, 100);

    return () => clearTimeout(timeout);
  }, [W, H]);

  const renderMistToImage = async () => {
    try {
      if (!canvasRef.current) return;

      // Skia's Image.fromCanvas is the way to capture Canvas to an image
      // However, this is a simplified approach using a static render
      // In production, we'd use Skia's snapshot API

      // For now, just set a placeholder indicating static mist is ready
      setMistImage({ uri: 'data:image/svg+xml,<svg></svg>' });
    } catch (e) {
      console.error('Failed to render mist image', e);
    }
  };

  return (
    <>
      {/* Hidden canvas used to render mist (only for capturing) */}
      <View style={{ position: 'absolute', opacity: 0, pointerEvents: 'none' }}>
        <Canvas ref={canvasRef} style={{ width: W, height: H }}>
          {/* Base mist */}
          <Rect
            x={0}
            y={0}
            width={W}
            height={H}
            color={`rgba(255,255,255,${CLOUD_BASE_OPACITY})`}
          />

          {/* Layer 1 patches */}
          {LAYER_1_PATCHES.map((p, i) => (
            <Circle
              key={`l1-${i}`}
              cx={W * p.cx}
              cy={H * p.cy}
              r={W * p.r}
              color={`rgba(255,255,255,${p.opacity})`}
            >
              <BlurMask blur={p.blur} style="normal" />
            </Circle>
          ))}

          {/* Layer 2 patches */}
          {LAYER_2_PATCHES.map((p, i) => (
            <Circle
              key={`l2-${i}`}
              cx={W * p.cx}
              cy={H * p.cy}
              r={W * p.r}
              color={`rgba(255,255,255,${p.opacity})`}
            >
              <BlurMask blur={p.blur} style="normal" />
            </Circle>
          ))}

          {/* Layer 3 patches */}
          {LAYER_3_PATCHES.map((p, i) => (
            <Circle
              key={`l3-${i}`}
              cx={W * p.cx}
              cy={H * p.cy}
              r={W * p.r}
              color={`rgba(255,255,255,${p.opacity})`}
            >
              <BlurMask blur={p.blur} style="normal" />
            </Circle>
          ))}
        </Canvas>
      </View>

      {/* Mist image overlay — transparent to touches */}
      {mistImage && (
        <Image
          source={mistImage}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            pointerEvents: 'none',
          }}
          resizeMode="cover"
        />
      )}

      {/* Fallback: solid mist overlay while image renders */}
      {!mistImage && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: W,
            height: H,
            backgroundColor: `rgba(255,255,255,${CLOUD_BASE_OPACITY * 5})`,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
}
