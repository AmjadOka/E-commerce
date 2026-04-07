import { IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @MinLength(3, { message: 'name should be 3 char length at least' })
  @MaxLength(100, { message: 'name should be 100 char length max' })
  name: string;
  @IsString()
  @IsUrl()
  image: string;
}
