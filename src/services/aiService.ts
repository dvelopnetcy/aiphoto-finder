// File: src/services/aiService.ts

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { decode as decodeJpeg } from 'jpeg-js';
import { getFlags } from '@/services/featureFlags'; // <-- align με το services/featureFlags

const MODEL_INFO = {
  name: 'mobilenetv2-7',
  version: '1.0.0',
  url: 'https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx',
};

const MODEL_DIR = `${FileSystem.cacheDirectory}models/mobilenet-v2/${MODEL_INFO.version}/`;
const MODEL_URI = `${MODEL_DIR}${MODEL_INFO.name}.onnx`;

const MODEL_INPUT_SIZE = 224;
const CHANNELS = 3;

let session: InferenceSession | null = null;

async function ensureDir(path: string) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) await FileSystem.makeDirectoryAsync(path, { intermediates: true });
  } catch {
    // ignore
  }
}

// Base64 -> Uint8Array (χωρίς Buffer/atob, ασφαλές για Hermes)
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

async function downloadModelIfNeeded(): Promise<string> {
  await ensureDir(MODEL_DIR);
  const info = await FileSystem.getInfoAsync(MODEL_URI);
  if (info.exists && info.size && info.size > 500_000) return MODEL_URI;

  const tmp = `${MODEL_URI}.download`;
  try {
    await FileSystem.deleteAsync(tmp, { idempotent: true });
  } catch {}
  const res = await FileSystem.downloadAsync(MODEL_INFO.url, tmp);
  if (!res || (res.status && res.status >= 400)) {
    throw new Error(`Model download failed: ${res?.status ?? 'unknown'}`);
  }
  await FileSystem.moveAsync({ from: tmp, to: MODEL_URI });
  return MODEL_URI;
}

export async function loadModel(): Promise<InferenceSession> {
  if (session) return session;
  console.log('[aiService] Loading ONNX model…');
  const modelPath = await downloadModelIfNeeded();
  session = await InferenceSession.create(modelPath, {});
  console.log('[aiService] ONNX model ready');
  return session;
}

async function imageToTensor(uri: string): Promise<Tensor> {
  // Διάβασε το αρχείο ως base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const u8 = base64ToUint8Array(base64);

  // JPEG → RGBA
  const decoded = decodeJpeg(u8, { useTArray: true });
  if (!decoded?.data || !decoded.width || !decoded.height) {
    throw new Error('Failed to decode JPEG');
  }

  const chw = resizeAndNormalizeRGBAtoCHW(
    decoded.data as Uint8Array,
    decoded.width,
    decoded.height,
    MODEL_INPUT_SIZE,
    MODEL_INPUT_SIZE
  );
  return new Tensor('float32', chw, [1, CHANNELS, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]); // NCHW
}

export async function generateEmbedding(photoUri: string): Promise<number[]> {
  // Feature flag: CLIP μονοπάτι (dynamic require για να μη «σπάει» το bundling αν λείπει)
  const flags = getFlags();
  if (flags.USE_CLIP_MODEL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod: any = require('@/services/clipService');
      if (mod?.clipService?.generateEmbedding) {
        return await mod.clipService.generateEmbedding(photoUri);
      }
    } catch (e) {
      console.warn('[aiService] CLIP path not available, fallback to MobileNet:', e);
    }
  }

  // Default: MobileNet
  const s = await loadModel();
  const input = await imageToTensor(photoUri);
  const feeds: Record<string, Tensor> = { [s.inputNames[0]]: input };
  const results = await s.run(feeds);
  const output = results[s.outputNames[0]];
  return Array.from(output.data as Float32Array);
}

export const aiService = { loadModel, generateEmbedding };
