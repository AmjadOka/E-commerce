import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { User } from '../user/user.schema';
import { Product } from 'src/product/product.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;

  @Prop()
  sessionId?: string;

  @Prop({
    type: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Product.name,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        color: {
          type: String,
          default: '',
        },
      },
    ],
    required: true,
  })
  cartItems: {
    productId: Types.ObjectId;
    quantity: number;
    color: string;
  }[];

  @Prop({ default: 0 })
  taxPrice: number;

  @Prop({ default: 0 })
  shippingPrice: number;

  @Prop({ required: true, default: 0 })
  totalOrderPrice: number;

  @Prop({
    type: String,
    enum: ['cash', 'card'],
    default: 'card',
  })
  paymentMethodType: 'cash' | 'card';

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAt?: Date;

  @Prop({ default: false })
  isDelivered: boolean;

  @Prop()
  deliveredAt?: Date;

  @Prop()
  shippingAddress: string;
}

export const orderSchema = SchemaFactory.createForClass(Order);
