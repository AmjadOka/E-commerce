import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * @fileoverview Category Schema Definition
 * Defines the MongoDB schema for product category documents including validation rules,
 * field types, and constraints for category name and image storage.
 *
 * @module CategorySchema
 */

/**
 * Category Document Type
 *
 * Type definition for a Mongoose hydrated Category document.
 * Provides TypeScript type safety for category documents retrieved from MongoDB.
 *
 * @typedef {HydratedDocument<Category>} categoryDocument
 *
 * @example
 * const category: categoryDocument = await categoryModel.findById(id);
 */
export type categoryDocument = HydratedDocument<Category>;

/**
 * Category Schema Class
 *
 * Defines the structure and validation rules for category documents in MongoDB.
 * Category entities represent product categories in the e-commerce system,
 * used for product organization and navigation.
 *
 * Fields:
 * - name: Unique category name with length validation
 * - image: Optional category icon or image URL
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * @class Category
 * @decorator @Schema({ timestamps: true })
 *
 * @property {string} name - Category name
 * @property {string} image - Category icon/image URL
 *
 * @example
 * const categoryDoc = {
 *   name: "Electronics",
 *   image: "https://example.com/electronics-icon.png",
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * };
 */
@Schema({ timestamps: true })
export class Category {
  /**
   * Category Name Field
   *
   * Unique identifier for the category. Must be unique within the collection.
   * Enforces length constraints for consistency and validity.
   *
   * @type {string}
   * @required
   * @decorator @Prop
   *
   * @validation
   * - Type: String
   * - Required: Yes (must be provided)
   * - Minimum length: 3 characters
   * - Maximum length: 40 characters
   * - Unique: Yes (enforced by collection index)
   *
   * @throws {ValidationError} If length < 3: 'Name must be at least 3 characters'
   * @throws {ValidationError} If length > 40: 'Name must be at most 30 characters'
   * @throws {MongoServerError} If duplicate name exists
   *
   * @remarks
   * - Used for product filtering and navigation
   * - Case-sensitive uniqueness check
   * - Should be URL-friendly for category pages
   *
   * @example
   * name: "Electronics" // Valid: 11 characters
   * name: "El" // Invalid: less than 3 characters
   * name: "Home & Garden" // Valid if <= 40 chars
   */
  @Prop({
    type: String,
    required: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [40, 'Name must be at most 30 characters'],
  })
  name: string;

  /**
   * Category Image/Icon Field
   *
   * Optional field for storing the category's icon or image URL.
   * Used for displaying category information in the frontend application.
   *
   * @type {string}
   * @optional
   * @decorator @Prop
   *
   * @validation
   * - Type: String
   * - Required: No (optional field)
   * - Format: URL (validation should be done in DTO)
   * - Default: undefined/null
   *
   * @remarks
   * - Should contain a valid image URL
   * - Used for category display in navigation
   * - Consider using cloud storage (S3, Cloudinary, etc.)
   * - Recommended image size: 100x100 to 200x200 pixels
   * - Can be updated independently
   *
   * @example
   * image: "https://example.com/categories/electronics-icon.png"
   * image: "https://cdn.example.com/electronics.webp"
   * image: undefined // if not provided
   */
  @Prop({
    type: String,
  })
  image: string;
}

/**
 * Category Schema Factory
 *
 * Mongoose schema definition created from the Category class.
 * Includes automatic timestamp management (createdAt, updatedAt).
 * Used for database operations like create, read, update, delete.
 *
 * @constant {Schema} categorySchema
 *
 * @remarks
 * - Automatically adds createdAt and updatedAt fields
 * - Converts class decorators into MongoDB schema
 * - Enables type-safe database operations
 * - Used in MongooseModule.forFeature() in modules
 * - Supports full-text search and indexing
 *
 * @example
 * MongooseModule.forFeature([
 *   { name: Category.name, schema: categorySchema }
 * ])
 */
export const categorySchema = SchemaFactory.createForClass(Category);
