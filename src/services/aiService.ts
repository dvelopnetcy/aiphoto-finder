// File: src/services/aiService.ts

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { decode as decodeJpeg } from 'jpeg-js';
import * as MediaLibrary from 'expo-media-library';
import { getFlags } from '@/services/featureFlags';

const log = (...args: any[]) => console.log('[aiService]', ...args);
const warn = (...args: any[]) => console.warn('[aiService]', ...args);
const err = (...args: any[]) => console.error('[aiService]', ...args);

// ---- ΜΟΝΤΕΛΟ ----
const MODEL_NAME = 'mobilenetv2-7.onnx';

// 1) Προτιμάμε asset μέσα στην εφαρμογή
const MODEL_ASSET_ID = require('../../assets/models/mobilenetv2-7.onnx');

// 2) Fallback URLs αν (για dev) λείπει το asset
const MODEL_URLS: string[] = [
  // CDN (σταθερό)
  'https://cdn.jsdelivr.net/gh/onnx/models@main/vision/classification/mobilenet/model/mobilenetv2-7.onnx',
  // GitHub με raw query
  'https://github.com/onnx/models/blob/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx?raw=1',
];

const MODEL_DIR = `${FileSystem.cacheDirectory}models/mobilenet-v2/1.0.0/`;
const MODEL_URI = `${MODEL_DIR}${MODEL_NAME}`;

const MODEL_INPUT_SIZE = 224;
const CHANNELS = 3;

let session: InferenceSession | null = null;

async function ensureDir(dirPath: string) {
  try {
    const info = await FileSystem.getInfoAsync(dirPath);
    if (!info.exists) await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
  } catch (e) {
    warn('ensureDir failed:', e);
  }
}

function getDirFromFilePath(p: string) {
  const i = p.lastIndexOf('/');
  return i > 0 ? p.slice(0, i + 1) : p;
}

// Base64 -> Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  let i = 0;
  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < base64.length) {
    const e1 = chars.indexOf(base64.charAt(i++));
    const e2 = chars.indexOf(base64.charAt(i++));
    const e3 = chars.indexOf(base64.charAt(i++));
    const e4 = chars.indexOf(base64.charAt(i++));
    const c1 = (e1 << 2) | (e2 >> 4);
    const c2 = ((e2 & 15) << 4) | (e3 >> 2);
    const c3 = ((e3 & 3) << 6) | e4;
    str += String.fromCharCode(c1);
    if (e3 !== 64) str += String.fromCharCode(c2);
    if (e4 !== 64) str += String.fromCharCode(c3);
  }
  const out = new Uint8Array(str.length);
  for (let j = 0; j < str.length; j++) out[j] = str.charCodeAt(j);
  return out;
}

// Nearest-neighbor resize RGBA -> 224x224 RGB, normalize [0..1], CHW
function resizeAndNormalizeRGBAtoCHW(
  rgba: Uint8Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Float32Array {
  const out = new Float32Array(CHANNELS * dstH * dstW);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let y = 0; y < dstH; y++) {
    const sy = Math.min(srcH - 1, Math.floor(y * yRatio));
    for (let x = 0; x < dstW; x++) {
      const sx = Math.min(srcW - 1, Math.floor(x * xRatio));
      const idx = (sy * srcW + sx) * 4; // RGBA
      const dst = y * dstW + x;
      out[0 * dstH * dstW + dst] = rgba[idx] / 255;
      out[1 * dstH * dstW + dst] = rgba[idx + 1] / 255;
      out[2 * dstH * dstW + dst] = rgba[idx + 2] / 255;
    }
  }
  return out;
}

// ---- Model loading helpers ----
async function getModelFromAsset(): Promise<string | null> {
  try {
    const asset = Asset.fromModule(MODEL_ASSET_ID);
    await asset.downloadAsync(); // no-op στο release, σε dev εξασφαλίζει ότι υπάρχει στο fs
    const local = asset.localUri ?? asset.uri;
    if (local) {
      log('Using bundled model asset at', local);
      return local;
    }
  } catch (e) {
    warn('getModelFromAsset failed:', e);
  }
  return null;
}

async function tryDownload(url: string, dest: string): Promise<boolean> {
  try {
    log('Downloading model from', url);
    const tmp = `${dest}.download`;
    try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}
    const res = await FileSystem.downloadAsync(url, tmp);
    if (!res || (res.status && res.status >= 400)) {
      throw new Error(String(res?.status ?? 'unknown'));
    }
    await FileSystem.moveAsync({ from: tmp, to: dest });
    log('Model saved to', dest);
    return true;
  } catch (e) {
    warn('Download failed:', e);
    return false;
  }
}

async function getModelUri(): Promise<string> {
  // 1) Δοκίμασε bundled asset
  const assetUri = await getModelFromAsset();
  if (assetUri) return assetUri;

  // 2) Fallback: κατέβασέ το και cache-αρέ το
  await ensureDir(MODEL_DIR);
  const info = await FileSystem.getInfoAsync(MODEL_URI);
  if (info.exists && (info.size ?? 0) > 500_000) {
    log('Using cached model at', MODEL_URI);
    return MODEL_URI;
  }
  for (const url of MODEL_URLS) {
    const ok = await tryDownload(url, MODEL_URI);
    if (ok) return MODEL_URI;
  }
  throw new Error('Could not obtain model (asset missing and all downloads failed).');
}

// Αν είναι content://, κάνε προσωρινό file://
async function ensureFileReadableUri(uri: string): Promise<string> {
  if (uri.startsWith('content://')) {
    const dest = `${FileSystem.cacheDirectory}imported/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.jpg`;
    await ensureDir(getDirFromFilePath(dest));
    await FileSystem.copyAsync({ from: uri, to: dest });
    return dest;
  }
  return uri;
}

export async function loadModel(): Promise<InferenceSession> {
  if (session) return session;
  log('Loading ONNX model…');
  const modelPath = await getModelUri();
  try {
    session = await InferenceSession.create(modelPath, {}); // CPU EP
    log('ONNX model ready (inputs:', session.inputNames, ', outputs:', session.outputNames, ')');
    return session;
  } catch (e) {
    err('Failed to create InferenceSession:', e);
    throw e;
  }
}

async function imageToTensor(uri: string): Promise<Tensor> {
  const readableUri = await ensureFileReadableUri(uri);
  const base64 = await FileSystem.readAsStringAsync(readableUri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  if (!base64 || base64.length < 1000) throw new Error(`Invalid image base64 from ${readableUri}`);

  const u8 = base64ToUint8Array(base64);
  const decoded = decodeJpeg(u8, { useTArray: true });
  if (!decoded?.data || !decoded.width || !decoded.height) throw new Error('Failed to decode JPEG');

  const chw = resizeAndNormalizeRGBAtoCHW(
    decoded.data as unknown as Uint8Array,
    decoded.width,
    decoded.height,
    MODEL_INPUT_SIZE,
    MODEL_INPUT_SIZE
  );
  return new Tensor('float32', chw, [1, CHANNELS, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]); // NCHW
}

export async function generateEmbedding(photoUri: string): Promise<number[]> {
  const flags = getFlags();
  if (flags.USE_CLIP_MODEL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod: any = require('@/services/clipService');
      if (mod?.clipService?.generateEmbedding) {
        log('Using CLIP path for embeddings');
        return await mod.clipService.generateEmbedding(photoUri);
      }
    } catch (e) {
      warn('CLIP path not available, fallback to MobileNet:', e);
    }
  }

  const s = await loadModel();
  const input = await imageToTensor(photoUri);
  const feeds: Record<string, Tensor> = { [s.inputNames[0]]: input };
  log('Running inference…');
  const results = await s.run(feeds);
  const output = results[s.outputNames[0]];
  const data = Array.from(output.data as Float32Array);
  log('Embedding size:', data.length);
  return data;
}

// Runtime permission πριν το scan
export async function ensureMediaPermission(): Promise<boolean> {
  try {
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    log('Media permission:', status, 'canAskAgain:', canAskAgain);
    return status === 'granted';
  } catch (e) {
    warn('requestPermissions failed', e);
    return false;
  }
}

export const aiService = { loadModel, generateEmbedding, ensureMediaPermission };
