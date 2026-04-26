import React, { useEffect, useRef, useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import {
  Canvas,
  Group,
  Rect,
  Circle,
  BlurMask,
  BlendMode,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
  useDerivedValue,
} from 'react-native-reanimated';
import { getTileCenter } from '../lib/spatial';
import { regionToProjector } from '../lib/projection';
import {
  CLOUD_TILE_BLOB_RADIUS,
  CLOUD_TILE_BLOB_BLUR,
  CLOUD_BLOOM_DURATION_MS,
  CLOUD_DRIFT_LAYER_1_DURATION,
  CLOUD_DRIFT_LAYER_2_DURATION,
  CLOUD_DRIFT_LAYER_3_DURATION,
  CLOUD_BASE_OPACITY,
} from '../lib/config';

// ─── Mist drift constants ──────────────────────────────────────────────────────
// Each layer oscillates horizontally by a percentage of screen width.
// Layers drift in alternating directions for natural parallax depth.
const DRIFT_1_PCT = 0.03;  // deep layer: +3% of screen width
const DRIFT_2_PCT = 0.05;  // mid layer:  -5%
const DRIFT_3_PCT = 0.07;  // surface:    +7%

// ─── Cloud patch definitions (static layout, moved by drift animations) ───────
// Each layer has several blurred white circles spread across the screen.
// They're defined as fractions of screen size so they scale on any device.
// Opacity values are intentionally very low — circles stack via SrcOver so
// 13 overlapping patches at the screen centre compound to ~0.18-0.22 total.
// Formula: 1 - (1-p)^n gives compound alpha for n equal layers.
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

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * CloudOverlay — Skia canvas fog-of-war overlay.
 *
 * Renders 3 drifting mist layers + soft tile blobs (in DstOut blend mode) that
 * punch transparent holes in the mist, exposing the map beneath. A bloom
 * animation grows from the user position when a new tile is unlocked.
 *
 * Props:
 *   tiles   — Array<{id: string}> — currently visible explored tiles
 *   newTile — {id: string, ts: number} | null — most-recently unlocked tile
 *   region  — react-native-maps region object | null
 */
export default function CloudOverlay({ tiles, newTile, region }) {
  const { width: W, height: H } = useWindowDimensions();

  // ─── Drift animations (Reanimated shared values) ─────────────────────────────
  const drift1 = useSharedValue(0);
  const drift2 = useSharedValue(0);
  const drift3 = useSharedValue(0);

  useEffect(() => {
    const amplitude1 = W * DRIFT_1_PCT;
    const amplitude2 = W * DRIFT_2_PCT;
    const amplitude3 = W * DRIFT_3_PCT;

    drift1.value = withRepeat(
      withSequence(
        withTiming(amplitude1,  { duration: CLOUD_DRIFT_LAYER_1_DURATION, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,           { duration: CLOUD_DRIFT_LAYER_1_DURATION, easing: Easing.inOut(Easing.sin) })
      ),
      -1 // infinite
    );

    drift2.value = withRepeat(
      withSequence(
        withTiming(-amplitude2, { duration: CLOUD_DRIFT_LAYER_2_DURATION, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,           { duration: CLOUD_DRIFT_LAYER_2_DURATION, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );

    drift3.value = withRepeat(
      withSequence(
        withTiming(amplitude3,  { duration: CLOUD_DRIFT_LAYER_3_DURATION, easing: Easing.inOut(Easing.sin) }),
        withTiming(0,           { duration: CLOUD_DRIFT_LAYER_3_DURATION, easing: Easing.inOut(Easing.sin) })
      ),
      -1
    );
  }, [W]);

  // Bridge Reanimated → Skia transform arrays
  const transform1 = useDerivedValue(() => [{ translateX: drift1.value }]);
  const transform2 = useDerivedValue(() => [{ translateX: drift2.value }]);
  const transform3 = useDerivedValue(() => [{ translateX: drift3.value }]);

  // ─── Bloom animation (most-recent new tile) ───────────────────────────────
  const bloomRadius = useSharedValue(0);
  const bloomX = useSharedValue(W / 2);
  const bloomY = useSharedValue(H / 2);

  const prevNewTileRef = useRef(null);

  useEffect(() => {
    if (!newTile?.id || !region) return;
    // Only trigger if this is genuinely a new event (id+ts pair)
    if (prevNewTileRef.current === newTile.id + newTile.ts) return;
    prevNewTileRef.current = newTile.id + newTile.ts;

    const project = regionToProjector(region, { width: W, height: H });
    const center  = getTileCenter(newTile.id);
    const pos     = project(center.latitude, center.longitude);

    bloomX.value = pos.x;
    bloomY.value = pos.y;
    bloomRadius.value = 0;
    bloomRadius.value = withTiming(CLOUD_TILE_BLOB_RADIUS, {
      duration: CLOUD_BLOOM_DURATION_MS,
      easing: Easing.out(Easing.cubic),
    });
  }, [newTile, region, W, H]);

  // ─── Project tile centers to screen pixels ────────────────────────────────
  const projectedTiles = useMemo(() => {
    if (!region || !tiles?.length) return [];
    const project = regionToProjector(region, { width: W, height: H });
    return tiles.map(tile => {
      const center = getTileCenter(tile.id);
      const { x, y } = project(center.latitude, center.longitude);
      return { id: tile.id, x, y };
    });
  }, [tiles, region, W, H]);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <Canvas style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {/*
        Outer Group with layer={true} creates an offscreen surface.
        This is required so that the DstOut blend group inside correctly
        punches transparent holes through the mist layers rather than
        compositing against the map background.
      */}
      <Group layer={true}>

        {/* ── Mist base: thin uniform white fill ── */}
        <Rect x={0} y={0} width={W} height={H} color={`rgba(255,255,255,${CLOUD_BASE_OPACITY})`} />

        {/* ── Drift Layer 1: deep, slow, heavily blurred ── */}
        <Group transform={transform1}>
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
        </Group>

        {/* ── Drift Layer 2: mid depth, medium blur ── */}
        <Group transform={transform2}>
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
        </Group>

        {/* ── Drift Layer 3: surface, fast, sharpest ── */}
        <Group transform={transform3}>
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
        </Group>

        {/*
          ── Tile blobs + Bloom: DstOut group ──
          Draws soft dark circles in DstOut blend mode — each circle erases the
          mist pixels above it, carving transparent holes. Adjacent circles
          merge via blur overlap (no grid lines visible).
        */}
        <Group blendMode={BlendMode.DstOut}>

          {/* Permanent explored-tile blobs */}
          {projectedTiles.map(tile => (
            <Circle
              key={tile.id}
              cx={tile.x}
              cy={tile.y}
              r={CLOUD_TILE_BLOB_RADIUS}
              color="rgba(0,0,0,1)"
            >
              <BlurMask blur={CLOUD_TILE_BLOB_BLUR} style="normal" />
            </Circle>
          ))}

          {/* Bloom: grows from 0→radius when a new tile is unlocked */}
          <Circle
            cx={bloomX}
            cy={bloomY}
            r={bloomRadius}
            color="rgba(0,0,0,1)"
          >
            <BlurMask blur={CLOUD_TILE_BLOB_BLUR} style="normal" />
          </Circle>

        </Group>
      </Group>
    </Canvas>
  );
}
