import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, couponSchema } from './coupon.schema';

/**
 * @fileoverview Coupon Module
 * Encapsulates coupon/discount code functionality including controllers, services,
 * and database schema imports for discount management operations.
 *
 * @module CouponModule
 */

/**
 * Coupon Module
 *
 * Provides discount coupon management functionality including creation, retrieval,
 * updating, and deletion of coupon records. Integrates MongoDB through
 * Mongoose for coupon data persistence.
 *
 * Imports the Coupon schema for database operations and exports CouponService
 * for use in other modules requiring coupon-related functionality, particularly
 * the Cart module for coupon application.
 *
 * @class CouponModule
 * @decorator @Module
 *
 * @example
 * // In app.module.ts
 * import { CouponModule } from './coupon/coupon.module';
 *
 * @Module({
 *   imports: [CouponModule],
 * })
 * export class AppModule {}
 */
@Module({
  /**
   * Module imports array
   *
   * Imports MongoDB schema through Mongoose for the Coupon entity,
   * making the Coupon model available for injection throughout the module.
   *
   * @type {Array}
   */
  imports: [
    /**
     * Mongoose feature registration for Coupon schema
     *
     * Registers the Coupon schema with Mongoose and makes the Coupon model
     * available for dependency injection in controllers and services.
     *
     * @param {string} name - The name of the model ('Coupon')
     * @param {Schema} schema - The Mongoose schema definition (couponSchema)
     */
    MongooseModule.forFeature([{ name: Coupon.name, schema: couponSchema }]),
  ],

  /**
   * Module controllers array
   *
   * Declares the CouponController which handles all HTTP requests
   * related to discount coupon management operations.
   *
   * @type {Array}
   * @see CouponController
   */
  controllers: [CouponController],

  /**
   * Module providers array
   *
   * Declares the CouponService which provides the business logic
   * for coupon operations and is injectable throughout the module.
   *
   * @type {Array}
   * @see CouponService
   */
  providers: [CouponService],
})
export class CouponModule {}
