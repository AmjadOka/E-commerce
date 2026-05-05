import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * @fileoverview Brand Schema Definition
 * Defines the MongoDB schema for brand documents including validation rules,
 * field types, and constraints for brand name and image storage.
 *
 * @module BrandSchema
 */

/**
 * Brand Document Type
 *
 * Type definition for a Mongoose hydrated Brand document.
 * Provides TypeScript type safety for brand documents retrieved from MongoDB.
 *
 * @typedef {HydratedDocument<Brand>} BrandDocument
 *
 * @example
 * const brand: BrandDocument = await brandModel.findById(id);
 */
export type BrandDocument = HydratedDocument<Brand>;

/**
 * Brand Schema Class
 *
 * Defines the structure and validation rules for brand documents in MongoDB.
 * Brand entities represent product brands or manufacturers in the e-commerce system.
 *
 * Fields:
 * - name: Unique brand name with length validation
 * - image: Optional brand logo or image URL
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * @class Brand
 * @decorator @Schema({ timestamps: true })
 *
 * @property {string} name - Brand name
 * @property {string} image - Brand logo/image URL
 *
 * @example
 * const brandDoc = {
 *   name: "Nike",
 *   image: "https://example.com/nike-logo.png",
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * };
 */
@Schema({ timestamps: true })
export class Brand {
  /**
   * Brand Name Field
   *
   * Unique identifier for the brand. Must be unique within the collection.
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
   * - Maximum length: 100 characters
   * - Unique: Yes (enforced by collection index)
   *
   * @throws {ValidationError} If length < 3: 'Name must be at least 3 characters'
   * @throws {ValidationError} If length > 100: 'Name must be at most 100 characters'
   * @throws {MongoServerError} If duplicate name exists
   *
   * @example
   * name: "Nike" // Valid: 4 characters
   * name: "Ad" // Invalid: less than 3 characters
   * name: "Very Long Brand Name..." // Valid if <= 100 chars
   */
  @Prop({
    type: String,
    required: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [100, 'Name must be at most 30 characters'],
  })
  name: string;

  /**
   * Brand Image/Logo Field
   *
   * Optional field for storing the brand's logo or image URL.
   * Used for displaying brand information in the frontend application.
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
   * - Consider using cloud storage (S3, Cloudinary, etc.)
   * - Can be updated independently
   * - Used for brand display and product listings
   *
   * @example
   * image: "https://example.com/brands/nike-logo.png"
   * image: "https://cdn.example.com/nike.webp"
   * image: undefined // if not provided
   */
  @Prop({
    type: String,
  })
  image: string;
}

/**
 * Brand Schema Factory
 *
 * Mongoose schema definition created from the Brand class.
 * Includes automatic timestamp management (createdAt, updatedAt).
 * Used for database operations like create, read, update, delete.
 *
 * @constant {Schema} brandSchema
 *
 * @remarks
 * - Automatically adds createdAt and updatedAt fields
 * - Converts class decorators into MongoDB schema
 * - Enables type-safe database operations
 * - Used in MongooseModule.forFeature() in modules
 *
 * @example
 * MongooseModule.forFeature([
 *   { name: Brand.name, schema: brandSchema }
 * ])
 */
export const brandSchema = SchemaFactory.createForClass(Brand);
