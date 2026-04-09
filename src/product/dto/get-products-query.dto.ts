import { Type } from 'class-transformer';
import { IsOptional, IsNumber } from 'class-validator';

export class GetProductsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @IsOptional()
  sort?: string;

  @IsOptional()
  fields?: string;

  @IsOptional()
  keyword?: string;

  @IsOptional()
  category?: string;

  [key: string]: any;
}
