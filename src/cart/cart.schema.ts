import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from 'src/product/product.schema';
import { User } from 'src/user/user.schema';
import { Coupon } from 'src/coupon/coupon.schema';

export type CartDocument = HydratedDocument<Cart>;

@Schema({ timestamps: true })
export class Cart {
  _id: Types.ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;

  @Prop([
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: Product.name,
        required: true,
      },

      quantity: {
        type: Number,
        required: true,
        min: 1,
      },

      color: {
        type: String,
        default: '',
      },
    },
  ])
  cartItems: {
    productId: Types.ObjectId;
    quantity: number;
    color?: string;
  }[];

  @Prop({
    type: [
      {
        name: {
          type: String,
        },
        couponId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: Coupon.name,
        },
      },
    ],
  })
  coupons: [
    {
      name: string;
      couponId: string;
    },
  ];

  @Prop({ default: 0 })
  totalPrice: number;

  @Prop({ default: 0 })
  totalPriceAfterDiscount: number;
}

export const cartSchema = SchemaFactory.createForClass(Cart);
