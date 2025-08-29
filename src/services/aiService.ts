// File: src/services/aiService.ts (Σταθερή ONNX έκδοση με ασφαλή προεπεξεργασία, χωρίς νέα deps)

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { decode as decodeJpeg } from 'jpeg-js';

// --- ΡΥΘΜΙΣΕΙΣ ΜΟΝΤΕΛΟΥ ---
// Χρησιμοποιούμε versioned διαδρομή ώστε μελλοντικά upgrades να συνυπάρχουν.
const MODEL_INFO = {
  name: 'mobilenetv2-7',
  version: '1.0.0',
  url: 'https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx',
  // Προαιρετικά βάλε εδώ SHA-256 αν θέλεις να ελέγχεται (π.χ. από release notes)
  sha256: null as string | null, // π.χ. 'abcdef1234...'(64 hex) ή άφησέ το null για παράκαμψη
};

// Πού θα σωθεί: <cache>/models/mobilenet-v2/1.0.0/model.onnx
const MODEL_DIR = `${FileSystem.cacheDirectory}models/mobilenet-v2/${MODEL_INFO.version}/`;
const MODEL_URI = `${MODEL_DIR}${MODEL_INFO.name}.onnx`;

const MODEL_INPUT_SIZE = 224; // 224x224
const CHANNELS = 3;           // RGB

let session: InferenceSession | null = null;

// Προσπαθούμε δυναμικά να φορτώσουμε expo-crypto αν υπάρχει (χωρίς να απαιτείται ως dep)
let Crypto: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Crypto = require('expo-crypto');
} catch {
  Crypto = null;
}

// ---------------- ΒΟΗΘΗΤΙΚΑ ----------------

async function ensureDir(path: string) {
  try {
    const info = await FileSystem.getInfoAsync(path);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(path, { intermediates: true });
    }
  } catch (e) {
    // Αν αποτύχει, θα ξαναδοκιμάσει στο download
  }
}

// Μικρός, αυτόνομος decoder Base64 → Uint8Array (χωρίς Buffer)
function base64ToUint8Array(base64: string): Uint8Array {
  // Προσπαθούμε να χρησιμοποιήσουμε atob αν υπάρχει
  const _atob =
    // @ts-ignore
    (globalThis as any).atob ||
    // Fallback: πολύ μικρός decoder base64
    ((b64: string) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
      let str = '';
      let i = 0;
      b64 = b64.replace(/[^A-Za-z0-9+/=]/g, '');
      while (i < b64.length) {
        const enc1 = chars.indexOf(b64.charAt(i++));
        const enc2 = chars.indexOf(b64.charAt(i++));
        const enc3 = chars.indexOf(b64.charAt(i++));
        const enc4 = chars.indexOf(b64.charAt(i++));
        const chr1 = (enc1 << 2) | (enc2 >> 4);
        const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
        const chr3 = ((enc3 & 3) << 6) | enc4;
        str += String.fromCharCode(chr1);
        if (enc3 !== 64) str += String.fromCharCode(chr2);
        if (enc4 !== 64) str += String.fromCharCode(chr3);
      }
      return str;
    });

  const binary = _atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// Απλό nearest-neighbor resize από RGBA → 224x224 RGB + normalization [0,1]
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

      // Normalize 0..255 → 0..1 (MobileNet v2 στον συγκεκριμένο φάκελο μοντέλων δέχεται 0..1)
      const rn = r / 255;
      const gn = g / 255;
      const bn = b / 255;

      const dstIndex = y * dstW + x;
      out[0 * dstH * dstW + dstIndex] = rn; // C=0 (R)
      out[1 * dstH * dstW + dstIndex] = gn; // C=1 (G)
      out[2 * dstH * dstW + dstIndex] = bn; // C=2 (B)
    }
  }

  return out;
}

// Προαιρετικός έλεγχος SHA-256 αν υπάρχει expo-crypto και έχει οριστεί checksum
async function verifySha256IfPossible(fileUri: string, expectedHex: string | null): Promise<boolean> {
  if (!Crypto || !expectedHex) return true; // δεν ελέγχουμε αν δεν υπάρχει checksum ή lib
  try {
    const data = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 });
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, data, {
      encoding: Crypto.CryptoEncoding.HEX,
    });
    return hash.toLowerCase() === expectedHex.toLowerCase();
  } catch {
    return false;
  }
}

// Κατεβάζει με ασφάλεια σε temp και κάνει atomic move
async function downloadModelIfNeeded(): Promise<string> {
  await ensureDir(MODEL_DIR);

  const info = await FileSystem.getInfoAsync(MODEL_URI);
  if (info.exists && info.size && info.size > 500_000) {
    // Αν υπάρχει και φαίνεται "λογικό" μέγεθος, προαιρετικά ελέγξτε checksum
    const ok = await verifySha256IfPossible(MODEL_URI, MODEL_INFO.sha256);
    if (ok) return MODEL_URI;
    // αλλιώς διαγράφουμε και ξανακατεβάζουμε
    try { await FileSystem.deleteAsync(MODEL_URI, { idempotent: true }); } catch {}
  }

  const tmp = `${MODEL_URI}.download`;
  try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}

  const res = await FileSystem.downloadAsync(MODEL_INFO.url, tmp);
  if (!res || (res.status && res.status >= 400)) {
    throw new Error(`Model download failed with status ${res?.status ?? 'unknown'}`);
  }

  // Προαιρετικός έλεγχος checksum
  const ok = await verifySha256IfPossible(tmp, MODEL_INFO.sha256);
  if (!ok) {
    try { await FileSystem.deleteAsync(tmp, { idempotent: true }); } catch {}
    throw new Error('Model checksum verification failed');
  }

  await FileSystem.moveAsync({ from: tmp, to: MODEL_URI });
  return MODEL_URI;
}

// ---------------- ΔΗΜΟΣΙΕΣ ΣΥΝΑΡΤΗΣΕΙΣ ----------------

export async function loadModel(): Promise<InferenceSession> {
  if (session) return session;

  console.log('[aiService] Loading ONNX model…');
  const modelPath = await downloadModelIfNeeded();

  // Δημιουργούμε ενιαίο session (singleton)
  session = await InferenceSession.create(modelPath, {
    // executionProviders: ['cpu'], // μπορείς να δοκιμάσεις 'nnapi' σε Android αν θες
    // graphOptimizationLevel: 'all',
  });

  console.log('[aiService] ONNX model ready');
  return session;
}

// Μετατροπή εικόνας (URI) → Tensor [1,3,224,224] float32
async function imageToTensor(uri: string): Promise<Tensor> {
  // Διαβάζουμε ως Base64 για να πάρουμε bytes
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const u8 = base64ToUint8Array(base64);

  // JPEG decode → { data: Uint8Array(RGBA), width, height }
  const decoded = decodeJpeg(u8, { useTArray: true });
  if (!decoded || !decoded.data || !decoded.width || !decoded.height) {
    throw new Error('Failed to decode JPEG');
  }

  // Resize + normalize → Float32Array(CHW)
  const chw = resizeAndNormalizeRGBAtoCHW(
    decoded.data as unknown as Uint8Array,
    decoded.width,
    decoded.height,
    MODEL_INPUT_SIZE,
    MODEL_INPUT_SIZE
  );

  return new Tensor('float32', chw, [1, CHANNELS, MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]); // NCHW
}

// Παράγει embedding/feature vector από την εικόνα.
// Σημ.: Το συγκεκριμένο MobileNet ONNX δίνει logits/features. Για V1.1 (CLIP) θα αλλάξει.
export async function generateEmbedding(photoUri: string): Promise<number[]> {
  const s = await loadModel();
  const input = await imageToTensor(photoUri);

  const feeds: Record<string, Tensor> = { [s.inputNames[0]]: input };
  const results = await s.run(feeds);
  const output = results[s.outputNames[0]];

  // Επιστρέφουμε απλό array για αποθήκευση σε SQLite (θα μπορούσες να πακετάρεις σε BLOB)
  return Array.from(output.data as Float32Array);
}

export const aiService = {
  loadModel,
  generateEmbedding,
};
