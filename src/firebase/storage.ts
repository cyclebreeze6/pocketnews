'use client';

import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads a file to a specified path in Firebase Storage.
 *
 * @param {FirebaseStorage} storage - The Firebase Storage instance.
 * @param {File} file - The file to upload.
 * @param {string} filePath - The desired path in the storage bucket (e.g., 'images/my-image.jpg').
 * @returns {Promise<string>} A promise that resolves with the public download URL of the uploaded file.
 */
export async function uploadFile(storage: FirebaseStorage, file: File, filePath: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    console.log('Uploaded a blob or file!', snapshot);
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    // Depending on your error handling strategy, you might want to re-throw the error
    // or return a specific error message.
    throw new Error('File upload failed.');
  }
}
