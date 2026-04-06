import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true })
export class Brand {
  @Prop({
    type: String,
    required: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [100, 'Name must be at most 30 characters'],
  })
  name: string;
  @Prop({
    type: String,
  })
  image: string;
}

export const brandSchema = SchemaFactory.createForClass(Brand);
