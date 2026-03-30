import { PartialType } from '@nestjs/mapped-types';
import { SignUpDto } from './auth.dto';

export class UpdateAuthDto extends PartialType(SignUpDto) {}
