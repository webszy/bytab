const databaseName = 'bytab-backgrounds';
const storeName = 'images';

async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => reject(request.error);
  });
}

async function imageRequest<T>(mode: IDBTransactionMode, create: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(storeName, mode);
      const request = create(transaction.objectStore(storeName));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? new Error('Image storage was interrupted.'));
      transaction.onerror = () => reject(transaction.error ?? request.error);
    });
  } finally {
    database.close();
  }
}

export function readBackground(id: string): Promise<unknown> {
  return imageRequest('readonly', store => store.get(id));
}

export function writeBackground(id: string, blob: Blob) {
  return imageRequest('readwrite', store => store.put(blob, id));
}

export function deleteBackground(id: string) {
  return imageRequest('readwrite', store => store.delete(id));
}

export async function prepareBackground(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('Choose a JPG, PNG or WebP image.');
  }
  if (file.size === 0 || file.size > 20 * 1024 * 1024) {
    throw new Error('Choose an image smaller than 20 MB.');
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error('This image could not be read. Choose another file.');
  }
  try {
    if (bitmap.width * bitmap.height > 40_000_000) {
      throw new Error('Choose an image with at most 40 megapixels.');
    }
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Image processing is unavailable.');
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not process this image.')), 'image/webp', 0.88);
    });
  } finally {
    bitmap.close();
  }
}
