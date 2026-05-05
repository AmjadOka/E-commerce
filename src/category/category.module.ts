import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Category, categorySchema } from './category.schema';

/**
 * @fileoverview Category Module
 * Encapsulates category-related functionality including controllers, services,
 * and database schema imports for product category management operations.
 *
 * @module CategoryModule
 */

/**
 * Category Module
 *
 * Provides product category management functionality including creation, retrieval,
 * updating, and deletion of category records. Integrates MongoDB through
 * Mongoose for category data persistence.
 *
 * Imports the Category schema for database operations and exports CategoryService
 * for use in other modules requiring category-related functionality.
 *
 * @class CategoryModule
 * @decorator @Module
 *
 * @example
 * // In app.module.ts
 * import { CategoryModule } from './category/category.module';
 *
 * @Module({
 *   imports: [CategoryModule],
 * })
 * export class AppModule {}
 */
@Module({
  /**
   * Module imports array
   *
   * Imports MongoDB schema through Mongoose for the Category entity,
   * making the Category model available for injection throughout the module.
   *
   * @type {Array}
   */
  imports: [
    /**
     * Mongoose feature registration for Category schema
     *
     * Registers the Category schema with Mongoose and makes the Category model
     * available for dependency injection in controllers and services.
     *
     * @param {string} name - The name of the model ('Category')
     * @param {Schema} schema - The Mongoose schema definition (categorySchema)
     */
    MongooseModule.forFeature([
      { name: Category.name, schema: categorySchema },
    ]),
  ],

  /**
   * Module controllers array
   *
   * Declares the CategoryController which handles all HTTP requests
   * related to product category management operations.
   *
   * @type {Array}
   * @see CategoryController
   */
  controllers: [CategoryController],

  /**
   * Module providers array
   *
   * Declares the CategoryService which provides the business logic
   * for category operations and is injectable throughout the module.
   *
   * @type {Array}
   * @see CategoryService
   */
  providers: [CategoryService],
})
export class CategoryModule {}
