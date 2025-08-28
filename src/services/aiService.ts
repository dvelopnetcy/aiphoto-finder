// File: src/services/aiService.ts (Η Τελική, Σταθερή ONNX Έκδοση)

import { InferenceSession, Tensor } from 'onnxruntime-react-native';
import * as FileSystem from 'expo-file-system';
import { decode } from 'jpeg-js';

// URL για ένα MobileNet v2 μοντέλο σε μορφή ONNX
const MODEL_URL = 'https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-7.onnx';
const MODEL_URI = `${FileSystem.cacheDirectory}mobilenetv2.onnx`;

const MODEL_INPUT_SIZE = 224;

let session: InferenceSession | null = null;

const loadModel = async (): Promise<InferenceSession> => {
  if (session) {
    return session;
  }

  console.log('Loading ONNX AI model...');
  const modelFileInfo = await FileSystem.getInfoAsync(MODEL_URI);

  if (!modelFileInfo.exists) {
    console.log('Model not found locally. Downloading...');
    await FileSystem.downloadAsync(MODEL_URL, MODEL_URI);
    console.log('Model downloaded and saved.');
  } else {
    console.log('Model found in local cache.');
  }

  session = await InferenceSession.create(MODEL_URI);
  console.log('ONNX model loaded successfully!');
  return session;
};

// Βοηθητική συνάρτηση για την επεξεργασία της εικόνας σε Tensor
const imageToTensor = async (uri: string): Promise<Tensor> => {
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const buffer = Buffer.from(base64, 'base64');
  const jpegData = decode(buffer, { useTArray: true }); // Χρησιμοποιούμε το jpeg-js

  const C = 3; // Channels (RGB)
  const H = MODEL_INPUT_SIZE;
  const W = MODEL_INPUT_SIZE;
  const tensor = new Float32Array(C * H * W);

  // Resize και normalize (απλοποιημένη λογική, για πιο ακριβή αποτελέσματα θα χρειαζόταν μια βιβλιοθήκη για resize)
  for (let c = 0; c < C; ++c) {
    for (let h = 0; h < H; ++h) {
      for (let w = 0; w < W; ++w) {
        // Αυτή είναι μια πολύ απλοποιημένη εκδοχή του resize.
        const value = jpegData.data[(h * jpegData.width + w) * 4 + c] / 255.0;
        tensor[c * H * W + h * W + w] = value;
      }
    }
  }

  return new Tensor('float32', tensor, [1, C, H, W]);
};


const generateEmbedding = async (photoUri: string): Promise<number[]> => {
  const loadedSession = await loadModel();
  const tensor = await imageToTensor(photoUri);
  
  const feeds: Record<string, Tensor> = {};
  feeds[loadedSession.inputNames[0]] = tensor;

  const results = await loadedSession.run(feeds);
  const outputTensor = results[loadedSession.outputNames[0]];

  return Array.from(outputTensor.data as Float32Array);
};

export const aiService = {
  loadModel,
  generateEmbedding,
};