// cloudinary.provider.ts

import { v2 as cloudinary } from 'cloudinary';

export const CloudinaryProvider = {
  provide: 'CLOUDINARY',

  useFactory: () => {
    return cloudinary.config({
      cloud_name: 'dh02xa1lg',
      api_key: '176113175622215',
      api_secret: 'wr_cBfKQw_XvR5OYcg7IzfnA-iA',
    });
  },
};
