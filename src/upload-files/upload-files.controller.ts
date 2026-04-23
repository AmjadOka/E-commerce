import {
  Controller,
  Post,
  UseInterceptors,
  UseGuards,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UploadedFiles,
} from '@nestjs/common';
import { Roles } from 'src/user/decorator/user.docerator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/user/guard/Auth.guard';
import { CloudinaryService } from './upload-files.service';

@Controller('v1/image')
export class UploadFilesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  //  @docs  User can upload image or file
  //  @Route  POST /api/v1/image/upload
  //  @access Private [admin, user]
  @Post('upload')
  @Roles(['admin', 'user'])
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 5 * 1024 * 1024,
          }),
          new FileTypeValidator({
            fileType: /(jpg|jpeg|png|webp)$/i,
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    console.log(file.size, 'file');
    return this.cloudinaryService.uploadFile(file);
  }
  //  @docs  Admin can upload images or files
  //  @Route  POST /api/v1/image/uploads
  //  @access Private [admin]
  @Post('uploads')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  @UseInterceptors(FilesInterceptor('files[]', 5))
  uploadImages(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 500000,
            message: 'File is too large must be less than 500KB',
          }),
          new FileTypeValidator({ fileType: 'image/png' }),
        ],
      }),
    )
    files: any,
  ) {
    return this.cloudinaryService.uploadFiles(files);
  }
}
