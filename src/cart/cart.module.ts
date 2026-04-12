import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, productSchema } from 'src/product/product.schema';
import { Coupon, couponSchema } from 'src/coupon/coupon.schema';
import { Cart, cartSchema } from './cart.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: productSchema,
      },
      {
        name: Coupon.name,
        schema: couponSchema,
      },
      { name: Cart.name, schema: cartSchema },
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}
