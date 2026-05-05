import { Module } from '@nestjs/common';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, productSchema } from 'src/product/product.schema';
import { Coupon, couponSchema } from 'src/coupon/coupon.schema';
import { Cart, cartSchema } from './cart.schema';

/**
 * @fileoverview Cart Module
 * Encapsulates shopping cart functionality including controllers, services,
 * and database schema imports for cart management operations.
 *
 * @module CartModule
 */

/**
 * Cart Module
 *
 * Provides shopping cart functionality including adding/removing products,
 * managing quantities, applying coupons, and calculating totals.
 * Integrates multiple MongoDB entities: Cart, Product, and Coupon.
 *
 * Imports all necessary schemas for cart operations and relationships
 * to products and coupons for a complete e-commerce cart system.
 *
 * @class CartModule
 * @decorator @Module
 *
 * @example
 * // In app.module.ts
 * import { CartModule } from './cart/cart.module';
 *
 * @Module({
 *   imports: [CartModule],
 * })
 * export class AppModule {}
 */
@Module({
  /**
   * Module imports array
   *
   * Registers MongoDB schemas through Mongoose for Cart, Product, and Coupon entities.
   * Makes all models available for dependency injection throughout the module.
   *
   * @type {Array}
   */
  imports: [
    /**
     * Mongoose feature registration for Product schema
     *
     * Registers the Product schema with Mongoose. Used to access product
     * information when items are added to cart (price, stock, discount).
     *
     * @param {string} name - The name of the model ('Product')
     * @param {Schema} schema - The Mongoose schema definition (productSchema)
     */
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: productSchema,
      },
      /**
       * Mongoose feature registration for Coupon schema
       *
       * Registers the Coupon schema with Mongoose. Used for coupon validation
       * and application, including expiration checking and discount calculation.
       *
       * @param {string} name - The name of the model ('Coupon')
       * @param {Schema} schema - The Mongoose schema definition (couponSchema)
       */
      {
        name: Coupon.name,
        schema: couponSchema,
      },
      /**
       * Mongoose feature registration for Cart schema
       *
       * Registers the Cart schema with Mongoose. Central model for cart operations
       * including storing items, calculating totals, and managing applied coupons.
       *
       * @param {string} name - The name of the model ('Cart')
       * @param {Schema} schema - The Mongoose schema definition (cartSchema)
       */
      { name: Cart.name, schema: cartSchema },
    ]),
  ],

  /**
   * Module controllers array
   *
   * Declares the CartController which handles all HTTP requests
   * related to shopping cart operations.
   *
   * @type {Array}
   * @see CartController
   */
  controllers: [CartController],

  /**
   * Module providers array
   *
   * Declares the CartService which provides the business logic
   * for cart operations and is injectable throughout the module.
   *
   * @type {Array}
   * @see CartService
   */
  providers: [CartService],
})
export class CartModule {}
