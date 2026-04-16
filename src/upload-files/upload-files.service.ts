// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';

import { UploadApiResponse } from 'cloudinary';
import * as streamifier from 'streamifier';

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
          folder: 'uploads', // 🔥 organize your files
          resource_type: 'auto', // handles images, videos, etc.
        },
        (error, result) => {
          if (error) {
            return reject(new Error(error.message || 'Upload failed'));
          }

          if (!result) {
            return reject(new Error('No result returned from Cloudinary'));
          }

          resolve(result);

          try {
            const stream: NodeJS.ReadableStream = streamifier.createReadStream(
              file.buffer,
            );

            stream.on('error', (err: Error) => {
              reject(new Error(`Stream error: ${err.message}`));
            });

            stream.pipe(uploadStream);
          } catch (err) {
            if (err instanceof Error) {
              reject(new Error(`Stream creation error: ${err.message}`));
            } else {
              reject(
                new Error('Unknown error occurred during stream creation'),
              );
            }
          }
        },
      );
    });
  }
  async uploadFiles(files: any[]): Promise<CloudinaryResponse[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }
}
