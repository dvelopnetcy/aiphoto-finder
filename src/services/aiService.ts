// File: src/services/aiService.ts (Final, Stable, High-Speed Version)

import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as FileSystem from 'expo-file-system';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import * as mobilenet from '@tensorflow-models/mobilenet';

// The remote URL for the FASTER, QUANTIZED model.
const MODEL_URL = 'https://tfhub.dev/tensorflow/tfjs-model/mobilenet_v2_1.0_224/quantops/classification/2/model.json?tfjs-format=file';

// We need to name the local file 'model.json' for the library to find it,
// and place it in a dedicated directory.
const MODEL_DIR = `${FileSystem.cacheDirectory}mobilenet_v2_quant/`;
const MODEL_JSON_URI = `${MODEL_DIR}model.json`;

const MODEL_INPUT_SIZE = 224;

let model: mobilenet.MobileNet | null = null;

// This helper function downloads the model.json and all its associated binary weight files.
const downloadModel = async (url: string, dir: string) => {
  // Ensure the destination directory exists.
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true });

  // Fetch the main model.json which contains the architecture and a manifest of weight files.
  const response = await fetch(url);
  const modelJson = await response.json();
  
  // Save the main model.json file.
  await FileSystem.writeAsStringAsync(
    `${dir}model.json`,
    JSON.stringify(modelJson)
  );

  // The 'weightsManifest' tells us where to find all the binary data files (.bin).
  if (modelJson.weightsManifest) {
    for (const group of modelJson.weightsManifest) {
      for (const path of group.paths) {
        // Construct the full URL for the weight file.
        const weightUrl = new URL(path, url).href;
        // The local path to save the weight file.
        const weightPath = `${dir}${path}`;
        console.log(`Downloading model asset: ${path}`);
        await FileSystem.downloadAsync(weightUrl, weightPath);
      }
    }
  }
};

const loadModel = async () => {
  if (model) {
    return model;
  }

  console.log('Loading HIGH-SPEED QUANTIZED AI model...');
  await tf.ready();

  const modelFileInfo = await FileSystem.getInfoAsync(MODEL_JSON_URI);

  if (!modelFileInfo.exists) {
    console.log('Model not found locally. Downloading...');
    await downloadModel(MODEL_URL, MODEL_DIR);
    console.log('Model downloaded and saved successfully.');
  } else {
    console.log('Model found in local cache. Loading from file.');
  }

  // This is the stable way to load a model. We provide a native file path ('file://...').
  // The MobileNet library is designed to handle this correctly, avoiding the "blob" error.
  model = await mobilenet.load({
    modelUrl: `file://${MODEL_JSON_URI}`,
    version: 2,
    alpha: 1.0,
  });

  console.log('High-speed model loaded successfully!');
  return model;
};

const uriToTensor = async (uri: string): Promise<tf.Tensor3D> => {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists || fileInfo.isDirectory) {
    throw new Error(`Invalid file at URI: ${uri}`);
  }

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const rawImageData = tf.util.encodeString(base64, 'base64');
  const imageTensor = decodeJpeg(rawImageData);

  const resized = tf.image.resizeBilinear(imageTensor, [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

  tf.dispose(imageTensor);

  return resized as tf.Tensor3D;
};

const generateEmbedding = async (photoUri: string): Promise<number[]> => {
  const loadedModel = await loadModel();
  if (!loadedModel) {
    throw new Error('AI Model is not loaded!');
  }

  const imageTensor = await uriToTensor(photoUri);
  // The .infer() method gives us the powerful vector embedding.
  const embeddingTensor = loadedModel.infer(imageTensor, true);
  const embedding = await embeddingTensor.data();

  tf.dispose([imageTensor, embeddingTensor]);

  return Array.from(embedding);
};

export const aiService = {
  loadModel,
  generateEmbedding,
};