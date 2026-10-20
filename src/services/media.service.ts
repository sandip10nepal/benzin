/**
 * Media Service — Multi-tenant restaurant image management & GCS integration
 *
 * Responsibilities:
 * 1. Validate image format by magic bytes (JPEG, PNG, WebP only; rejects SVGs/executables).
 * 2. Optimize images via Sharp (auto-orient, resize, WebP conversion, strip EXIF).
 * 3. Upload to Google Cloud Storage (or local dev storage when GCS_MEDIA_BUCKET is unset).
 * 4. Validate and sanitize external image URLs with strict SSRF protection.
 * 5. Manage MongoDB Atlas metadata records in `restaurant_media` collection.
 * 6. Enforce restaurant-level multi-tenant isolation.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { Storage } from '@google-cloud/storage';
import { env } from '../config/env';
import { MultiTenantDbService } from './multi-tenant-db.service';
import type { RestaurantMedia, MediaCategory, MediaSourceType } from '../models/types';

// Maximum upload file size: 5 MB
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024;

// Magic bytes definitions for secure image validation
const MAGIC_BYTES = {
  JPEG: [0xFF, 0xD8, 0xFF],
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // "RIFF"
  WEBP_TYPE: [0x57, 0x45, 0x42, 0x50], // "WEBP" at offset 8
};

export class MediaService {
  private static storageClient: Storage | null = null;

  /**
   * Initialize Google Cloud Storage client lazily
   */
  private static getStorageClient(): Storage {
    if (!this.storageClient) {
      this.storageClient = new Storage();
    }
    return this.storageClient;
  }

  /**
   * Validate image content by checking actual buffer magic bytes
   */
  public static validateImageMagicBytes(buffer: Buffer): { valid: boolean; detectedMime?: string; error?: string } {
    if (!buffer || buffer.length < 12) {
      return { valid: false, error: 'File is empty or corrupted (insufficient byte length).' };
    }

    // Check JPEG (starts with FF D8 FF)
    if (buffer[0] === MAGIC_BYTES.JPEG[0] && buffer[1] === MAGIC_BYTES.JPEG[1] && buffer[2] === MAGIC_BYTES.JPEG[2]) {
      return { valid: true, detectedMime: 'image/jpeg' };
    }

    // Check PNG (starts with 89 50 4E 47 0D 0A 1A 0A)
    const isPng = MAGIC_BYTES.PNG.every((byte, idx) => buffer[idx] === byte);
    if (isPng) {
      return { valid: true, detectedMime: 'image/png' };
    }

    // Check WebP (starts with RIFF and has WEBP at offset 8)
    const isRiff = MAGIC_BYTES.WEBP_RIFF.every((byte, idx) => buffer[idx] === byte);
    const isWebp = MAGIC_BYTES.WEBP_TYPE.every((byte, idx) => buffer[8 + idx] === byte);
    if (isRiff && isWebp) {
      return { valid: true, detectedMime: 'image/webp' };
    }

    return {
      valid: false,
      error: 'Unsupported or disguised file format. Only JPEG, PNG, and WebP images are permitted.',
    };
  }

  /**
   * SSRF Protection: Validate external image URLs
   */
  public static validateExternalUrl(urlString: string): { valid: boolean; normalizedUrl?: string; error?: string } {
    if (!urlString || typeof urlString !== 'string') {
      return { valid: false, error: 'URL string is required.' };
    }

    const trimmed = urlString.trim();
    let parsed: URL;
    try {
      parsed = new URL(trimmed);
    } catch {
      return { valid: false, error: 'Invalid URL format.' };
    }

    // Strict protocol check: HTTPS only
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'External image URL must use secure HTTPS protocol.' };
    }

    const hostname = parsed.hostname.toLowerCase();

    // Prevent SSRF / internal network access
    const isPrivate =
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '169.254.169.254' || // Cloud metadata server
      hostname === '::1' ||
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname);

    if (isPrivate) {
      return { valid: false, error: 'Security violation: Access to internal or loopback addresses is prohibited.' };
    }

    return { valid: true, normalizedUrl: parsed.toString() };
  }

  /**
   * Optimize image via Sharp
   */
  public static async optimizeImage(
    buffer: Buffer,
    category: MediaCategory
  ): Promise<{ buffer: Buffer; width?: number; height?: number; format: string }> {
    let pipeline = sharp(buffer, { failOn: 'error' }).rotate(); // Auto-orient based on EXIF

    if (category === 'logo') {
      // Logos: max 512x512, preserve alpha transparency
      pipeline = pipeline
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 85, effort: 4, alphaQuality: 90 });
    } else if (category === 'menu') {
      // Menu items: max 1200x1200, high visual clarity, compressed WebP
      pipeline = pipeline
        .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 });
    } else if (category === 'branding') {
      // Branding / Banners: max 1920x1080
      pipeline = pipeline
        .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 });
    } else {
      pipeline = pipeline
        .resize(1000, 1000, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 80, effort: 4 });
    }

    const outputBuffer = await pipeline.toBuffer();
    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width,
      height: metadata.height,
      format: 'image/webp',
    };
  }

  public static readonly APPROVED_PUBLIC_CATEGORIES: MediaCategory[] = ['menu', 'logo', 'branding'];

  /**
   * Store media binary in GCS bucket or local disk fallback
   */
  private static async storeMediaBinary(
    objectKey: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ storageProvider: 'gcs' | 'local'; publicUrl: string; bucketName?: string }> {
    const bucketName = env.GCS_MEDIA_BUCKET;

    if (bucketName) {
      // Production GCS Upload with immutable versioning cache headers
      const storage = this.getStorageClient();
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(objectKey);

      await file.save(buffer, {
        resumable: false,
        metadata: {
          contentType: mimeType,
          cacheControl: 'public, max-age=31536000, immutable',
        },
      });

      const publicUrl = `https://storage.googleapis.com/${bucketName}/${objectKey}`;
      return { storageProvider: 'gcs', publicUrl, bucketName };
    }

    // Local Development Fallback Storage
    const localUploadsDir = path.join(process.cwd(), 'public', 'uploads');
    const fullPath = path.join(localUploadsDir, objectKey);
    const parentDir = path.dirname(fullPath);

    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }

    fs.writeFileSync(fullPath, buffer);
    const publicUrl = `/uploads/${objectKey}`;
    return { storageProvider: 'local', publicUrl };
  }

  /**
   * Delete media binary from GCS or Local Disk
   */
  private static async deleteMediaBinary(media: RestaurantMedia): Promise<void> {
    try {
      if (media.storage_provider === 'gcs' && media.bucket_name && media.object_key) {
        const storage = this.getStorageClient();
        const file = storage.bucket(media.bucket_name).file(media.object_key);
        await file.delete({ ignoreNotFound: true });
      } else if (media.storage_provider === 'local' && media.object_key) {
        const localPath = path.join(process.cwd(), 'public', 'uploads', media.object_key);
        if (fs.existsSync(localPath)) {
          fs.unlinkSync(localPath);
        }
      }
    } catch (err) {
      console.warn(`[MediaService] Warning: Failed to delete media binary for ${media._id}:`, err);
    }
  }

  /**
   * Generate canonical immutable versioned object key
   */
  public static generateObjectKey(restaurantId: string, category: MediaCategory, mediaId: string): string {
    if (!this.APPROVED_PUBLIC_CATEGORIES.includes(category)) {
      throw new Error(
        `Category '${category}' is strictly not permitted in public media storage. Private documents, employee records, payroll data, and sensitive files must never be uploaded to the public bucket.`
      );
    }
    return `restaurants/${restaurantId}/${category}/${mediaId}.webp`;
  }

  /**
   * Create a new media upload record
   */
  public static async uploadMedia(params: {
    restaurantId: string;
    category: MediaCategory;
    fileBuffer: Buffer;
    originalFilename?: string;
    uploadedBy?: string;
  }): Promise<RestaurantMedia> {
    const { restaurantId, category, fileBuffer, originalFilename, uploadedBy } = params;

    // 1. Magic bytes validation
    const magic = this.validateImageMagicBytes(fileBuffer);
    if (!magic.valid) {
      throw new Error(magic.error || 'Invalid image file.');
    }

    // 2. Sharp optimization
    const optimized = await this.optimizeImage(fileBuffer, category);

    // 3. Generate media identifier and canonical key
    const mediaId = `med_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const objectKey = this.generateObjectKey(restaurantId, category, mediaId);

    // 4. Store binary in GCS / Local
    const { storageProvider, publicUrl, bucketName } = await this.storeMediaBinary(
      objectKey,
      optimized.buffer,
      optimized.format
    );

    // 5. Build metadata document
    const now = new Date().toISOString();
    const mediaDoc: RestaurantMedia = {
      _id: mediaId,
      restaurant_id: restaurantId,
      source_type: 'upload',
      category,
      storage_provider: storageProvider,
      bucket_name: bucketName,
      object_key: objectKey,
      public_url: publicUrl,
      original_filename: originalFilename || 'image.webp',
      mime_type: optimized.format,
      file_size: optimized.buffer.length,
      width: optimized.width,
      height: optimized.height,
      uploaded_by: uploadedBy,
      created_at: now,
      updated_at: now,
    };

    // 6. Persist to MongoDB Atlas `restaurant_media`
    await MultiTenantDbService.saveMediaRecord(mediaDoc);

    return mediaDoc;
  }

  /**
   * Register an external URL as a media record
   */
  public static async registerExternalUrl(params: {
    restaurantId: string;
    category: MediaCategory;
    externalUrl: string;
    name?: string;
    uploadedBy?: string;
  }): Promise<RestaurantMedia> {
    const { restaurantId, category, externalUrl, name, uploadedBy } = params;

    if (!this.APPROVED_PUBLIC_CATEGORIES.includes(category)) {
      throw new Error(`Category '${category}' is strictly not permitted in public media storage.`);
    }

    const validated = this.validateExternalUrl(externalUrl);
    if (!validated.valid || !validated.normalizedUrl) {
      throw new Error(validated.error || 'Invalid external URL.');
    }

    const mediaId = `ext_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();

    const mediaDoc: RestaurantMedia = {
      _id: mediaId,
      restaurant_id: restaurantId,
      source_type: 'external_url',
      category,
      public_url: validated.normalizedUrl,
      external_url: validated.normalizedUrl,
      original_filename: name || 'External Media',
      mime_type: 'image/external',
      uploaded_by: uploadedBy,
      created_at: now,
      updated_at: now,
    };

    await MultiTenantDbService.saveMediaRecord(mediaDoc);
    return mediaDoc;
  }

  /**
   * List media library for a tenant
   */
  public static async listMedia(params: {
    restaurantId: string;
    category?: MediaCategory;
    limit?: number;
    skip?: number;
  }): Promise<{ media: RestaurantMedia[]; total: number }> {
    return MultiTenantDbService.listMediaRecords(params);
  }

  /**
   * Get single media record with tenant isolation
   */
  public static async getMediaById(restaurantId: string, mediaId: string): Promise<RestaurantMedia | null> {
    const record = await MultiTenantDbService.getMediaRecordById(mediaId);
    if (!record || record.restaurant_id !== restaurantId) {
      return null;
    }
    return record;
  }

  /**
   * Delete media record with tenant isolation
   */
  public static async deleteMedia(restaurantId: string, mediaId: string): Promise<boolean> {
    const record = await this.getMediaById(restaurantId, mediaId);
    if (!record) {
      return false;
    }

    // Delete binary
    await this.deleteMediaBinary(record);

    // Delete MongoDB record
    return MultiTenantDbService.deleteMediaRecord(restaurantId, mediaId);
  }
}
