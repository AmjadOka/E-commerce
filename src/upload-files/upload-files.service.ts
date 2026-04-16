// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';

import * as streamifier from 'streamifier';

@Injectable()
export class CloudinaryService {
  uploadFile(file: { buffer: Buffer }): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        (error, result) => {
          if (error) return reject(new Error(error.message || 'Upload failed'));
          if (!result)
            return reject(new Error('No result returned from Cloudinary'));
          resolve(result as CloudinaryResponse);
        },
      );

      if (!file || !file.buffer) {
        return reject(new Error('Invalid file input'));
      }
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async uploadFiles(files: any[]): Promise<CloudinaryResponse[]> {
    return Promise.all(files.map((file) => this.uploadFile(file)));
  }
}
