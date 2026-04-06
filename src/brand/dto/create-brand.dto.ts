import { IsString, IsUrl, Max, Min } from 'class-validator';

export class CreateBrandDto {
  @IsString()
  @IsUrl()
  @Min(3, { message: 'name should be 3 char length at least' })
  @Max(100, { message: 'name should be 100 char length max' })
  name: string;
  @IsString()
  @IsUrl()
  image: string;
}
