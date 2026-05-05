import { Module } from '@nestjs/common';
import { BrandService } from './brand.service';
import { BrandController } from './brand.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Brand, brandSchema } from './brand.schema';

/**
 * @fileoverview Brand Module
 * Encapsulates brand-related functionality including controllers, services,
 * and database schema imports for brand management operations.
 *
 * @module BrandModule
 */

/**
 * Brand Module
 *
 * Provides brand management functionality including creation, retrieval,
 * updating, and deletion of brand records. Integrates MongoDB through
 * Mongoose for brand data persistence.
 *
 * Imports the Brand schema for database operations and exports BrandService
 * for use in other modules requiring brand-related functionality.
 *
 * @class BrandModule
 * @decorator @Module
 *
 * @example
 * // In app.module.ts
 * import { BrandModule } from './brand/brand.module';
 *
 * @Module({
 *   imports: [BrandModule],
 * })
 * export class AppModule {}
 */
@Module({
  /**
   * Module imports array
   *
   * Imports MongoDB schema through Mongoose for the Brand entity,
   * making the Brand model available for injection throughout the module.
   *
   * @type {Array}
   */
  imports: [
    /**
     * Mongoose feature registration for Brand schema
     *
     * Registers the Brand schema with Mongoose and makes the Brand model
     * available for dependency injection in controllers and services.
     *
     * @param {string} name - The name of the model ('Brand')
     * @param {Schema} schema - The Mongoose schema definition (brandSchema)
     */
    MongooseModule.forFeature([{ name: Brand.name, schema: brandSchema }]),
  ],

  /**
   * Module controllers array
   *
   * Declares the BrandController which handles all HTTP requests
   * related to brand management operations.
   *
   * @type {Array}
   * @see BrandController
   */
  controllers: [BrandController],

  /**
   * Module providers array
   *
   * Declares the BrandService which provides the business logic
   * for brand operations and is injectable throughout the module.
   *
   * @type {Array}
   * @see BrandService
   */
  providers: [BrandService],
})
export class BrandModule {}
