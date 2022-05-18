import { promises as fs } from 'fs';
import sharp from 'sharp';

export function saveFile(filename: string, file: string): Promise<void> {
  return fs.writeFile(filename, file);
}

export function readFile(filename: string): Promise<Buffer> {
  return fs.readFile(filename);
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await fs.access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(filename: string): Promise<string> {
  const json = await fs.readFile(filename);
  return JSON.parse(json.toString());
}

/**
 * in bytes
 */
export async function getFileSize(file: string | Buffer) {
  const stats = await fs.stat(file);
  return stats.size;
}

export const imageResizer = (w: number, h: number) => sharp().resize(w, h).withMetadata().jpeg();
