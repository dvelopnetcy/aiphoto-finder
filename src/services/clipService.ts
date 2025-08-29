// File: src/services/clipService.ts
// Stub για CLIP μέχρι να υλοποιηθεί πραγματικά.
// Δεν καλεί aiService για να αποφύγουμε κυκλική εξάρτηση & recursion.

export const clipService = {
  async generateEmbedding(_photoUri: string): Promise<number[]> {
    // TODO: Αντικατάσταση με πραγματικό CLIP embedding (V1.1)
    throw new Error('CLIP model not implemented yet');
  },
};
