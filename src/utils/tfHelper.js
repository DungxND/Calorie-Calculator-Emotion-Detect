import * as tf from '@tensorflow/tfjs';

export const loadTFModel = async (modelPath) => {
  try {
    const model = await tf.loadLayersModel(modelPath);
    return model;
  } catch (error) {
    console.error('Error loading model:', error);
    throw error;
  }
};

export const preprocessImage = (imageData) => {
  // Convert to tensor
  const tensor = tf.browser.fromPixels(imageData)
    .resizeNearestNeighbor([224, 224]) // Resize
    .toFloat();
  
  // Normalize
  const offset = tf.scalar(127.5);
  const normalized = tensor.sub(offset).div(offset);
  
  // Expand dimensions
  return normalized.expandDims();
};

export const getEmotionLabel = (predictions) => {
  const emotions = ['angry', 'disgust', 'fear', 'happy', 'sad', 'surprise', 'neutral'];
  const maxIndex = predictions.indexOf(Math.max(...predictions));
  return emotions[maxIndex];
};