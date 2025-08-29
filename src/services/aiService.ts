// File: src/services/aiService.ts (No expo-crypto; bundler-safe)

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { decode as decodeJpeg } from 'jpeg-js';

// --- Model info (versioned path; checksum off for now) ---
const MODEL_INFO = {
  name: 'mobilenetv2-7',
  version: '1.0.0',
  url: 'https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx',
};

const MODEL_DIR = `${FileSystem.cacheDirectory}models/mobilenet-v2/${MODEL_INFO.version}/`;
const MODEL_URI = `${MODEL_DIR}${MODEL_INFO.name}.onnx`;

const MODEL_INPUT_SIZE = 224; // 224x224
const CHANNELS = 3;           // RGB

let session: InferenceSession | null = null;

// ---------------- Helpers ----------------
async function ensureDir(path: string) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  } catch {
    // ignore
  }
}

// Base64 -> Uint8Array (no Buffer usage)
function base64ToUint8Array(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = '';
  let i = 0;
  base64 = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < base64.length) {
    const enc1 = chars.indexOf(base64.charAt(i++));
    const enc2 = chars.indexOf(base64.charAt(i++));
    const enc3 = chars.indexOf(base64.charAt(i++));
    const enc4 = chars.indexOf(base64.charAt(i++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    str += String.fromCharCode(chr1);
    if (enc3 !== 64) str += String.fromCharCode(chr2);
    if (enc4 !== 64) str += String.fromCharCode(chr3);
  }
  const len = str.length;
  const bytes = new Uint8Array(len);
  for (let j = 0; j < len; j++) bytes[j] = str.charCodeAt(j);
  return bytes;
}

// Nearest-neighbor resize RGBA -> 224x224 RGB, normalize to [0,1], CHW
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
      const srcIdx = (sy * srcW + sx) * 4; // RGBA
      const r = rgba[srcIdx];
      const g = rgba[srcIdx + 1];
      const b = rgba[srcIdx + 2];

      const dstIndex = y * dstW + x;
      out[0 * dstH * dstW + dstIndex] = r / 255;
      out[1 * dstH * dstW + dstIndex] = g / 255;
      out[2 * dstH * dstW + dstIndex] = b / 255;
    }
  }
  return out;
}

async function downloadModelIfNeeded(): Promise<string> {
  await ensureDir(MODEL_DIR);

  const info = await FileSystem.getInfoAsync(MODEL_URI);
  if (info.exists && info.size && info.size > 500_000) {
    return MODEL_URI;
  }

  const tmp = `${MODEL_URI}.download`;
  try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}
  const res = await FileSystem.downloadAsync(MODEL_INFO.url, tmp);
  if (!res || (res.status && res.status >= 400)) {
    throw new Error(`Model download failed with status ${res?.status ?? 'unknown'}`);
  }
  await FileSystem.moveAsync({ from: tmp, to: MODEL_URI });
  return MODEL_URI;
}

// ---------------- Public API ----------------
export async function loadModel(): Promise<InferenceSession> {
  if (session) return session;

  console.log('[aiService] Loading ONNX model…');
  const modelPath = await downloadModelIfNeeded();

  session = await InferenceSession.create(modelPath, {
    // executionProviders: ['cpu'], // try 'nnapi' on Android if you benchmark it faster
    // graphOptimizationLevel: 'all',
  });

  console.log('[aiService] ONNX model ready');
  return session;
}

async function imageToTensor(uri: string): Promise<Tensor> {
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const u8 = base64ToUint8Array(base64);

  const decoded = decodeJpeg(u8, { useTArray: true });
  if (!decoded || !decoded.data || !decoded.width || !decoded.height) {
    throw new Error('Failed to decode JPEG');
  }

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
  const s = await loadModel();
  const input = await imageToTensor(photoUri);
  const feeds: Record<string, Tensor> = { [s.inputNames[0]]: input };
  const results = await s.run(feeds);
  const output = results[s.outputNames[0]];
  return Array.from(output.data as Float32Array);
}

export const aiService = { loadModel, generateEmbedding };
