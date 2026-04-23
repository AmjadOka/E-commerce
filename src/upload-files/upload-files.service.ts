// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';

import { UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  uploadFile(file: {
    originalname: string;
    mimetype: string;
    buffer: Buffer;
  }): Promise<UploadApiResponse> {
    if (!file?.buffer) {
      return Promise.reject(new Error('Invalid file input'));
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'uploads',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message || 'Upload failed'));
          }

          if (!result) {
            return reject(new Error('No result returned from Cloudinary'));
          }

          resolve(result);
        },
      );

      try {
        const stream = Readable.from(file.buffer); // 🔥 no need for streamifier

        stream.on('error', (err: Error) => {
          reject(new Error(`Stream error: ${err.message}`));
        });

        stream.pipe(uploadStream); // ✅ pipe BEFORE callback fires
      } catch (err) {
        reject(
          new Error(
            err instanceof Error
              ? `Stream creation error: ${err.message}`
              : 'Unknown stream error',
          ),
        );
      }
    });
  }
  async uploadFiles(files: any[]): Promise<CloudinaryResponse[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }
}
