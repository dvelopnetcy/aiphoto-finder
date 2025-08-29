// src/types/assets.d.ts
declare module '*.onnx' {
  const uri: number; // Metro asset id (όπως τα images)
  export default uri;
}
