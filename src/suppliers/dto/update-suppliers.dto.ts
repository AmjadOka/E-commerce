import { PartialType } from '@nestjs/mapped-types';
import { CreateSuppliersDto } from './create-suppliers.dto';

export class UpdateSupplierDto extends PartialType(CreateSuppliersDto) {}
