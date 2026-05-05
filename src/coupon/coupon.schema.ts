import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

/**
 * @fileoverview Coupon Schema Definition
 * Defines the MongoDB schema for discount coupon documents including validation rules,
 * field types, and constraints for coupon codes, expiration dates, and discount amounts.
 *
 * @module CouponSchema
 */

/**
 * Coupon Document Type
 *
 * Type definition for a Mongoose hydrated Coupon document.
 * Provides TypeScript type safety for coupon documents retrieved from MongoDB.
 *
 * @typedef {HydratedDocument<Coupon>} couponDocument
 *
 * @example
 * const coupon: couponDocument = await couponModel.findById(id);
 */
export type couponDocument = HydratedDocument<Coupon>;

/**
 * Coupon Schema Class
 *
 * Defines the structure and validation rules for discount coupon documents in MongoDB.
 * Coupon entities represent discount codes used in the e-commerce system for
 * promotional and marketing purposes.
 *
 * Fields:
 * - name: Unique coupon code/name with length validation
 * - expireDate: Expiration date with future date validation
 * - discount: Discount amount applied when coupon is used
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * @class Coupon
 * @decorator @Schema({ timestamps: true })
 *
 * @property {string} name - Coupon code/name
 * @property {Date} expireDate - Expiration date
 * @property {number} discount - Discount amount
 *
 * @example
 * const couponDoc = {
 *   name: "SUMMER20",
 *   expireDate: "2024-08-31T23:59:59Z",
 *   discount: 20,
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * };
 */
@Schema({ timestamps: true })
export class Coupon {
  /**
   * Coupon Name/Code Field
   *
   * Unique identifier for the coupon. This is the code customers use to apply the discount.
   * Must be unique within the collection to prevent duplicate coupon codes.
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
   * @throws {MongoServerError} If duplicate coupon code exists
   *
   * @remarks
   * - Case-sensitive uniqueness check
   * - Used by customers to apply discount in cart
   * - Should be memorable and easy to type
   * - Often used in marketing campaigns
   * - Common format: ALL_CAPS_WITH_NUMBERS (e.g., SUMMER20, SAVE50)
   *
   * @example
   * name: "SUMMER20" // Valid: promotional code
   * name: "FREESHIP" // Valid: free shipping code
   * name: "AD" // Invalid: less than 3 characters
   * name: "NewYearMegaSale2024December" // Valid if <= 100 chars
   */
  @Prop({
    type: String,
    required: true,
    min: [3, 'Name must be at least 3 characters'],
    max: [100, 'Name must be at most 100 characters'],
  })
  name: string;

  /**
   * Coupon Expiration Date Field
   *
   * Date and time when the coupon becomes invalid and cannot be used.
   * Must be set to a future date at the time of creation.
   * After this date, the coupon cannot be applied to any new transactions.
   *
   * @type {Date}
   * @required
   * @decorator @Prop
   *
   * @validation
   * - Type: Date/DateTime
   * - Required: Yes (must be provided)
   * - Minimum: Current date/time (enforced at controller level)
   * - Format: ISO 8601 (YYYY-MM-DDTHH:mm:ssZ)
   *
   * @throws {ValidationError} If date is in the past: 'Coupon can't be expired'
   *
   * @remarks
   * - Must be in the future when creating or updating coupon
   * - Validation is performed at controller level, not schema
   * - Used to determine if coupon is active and usable
   * - Common duration: 1-3 months for promotional coupons
   * - Should consider timezone implications
   * - Expired coupons cannot be used but are retained for audit
   *
   * @example
   * expireDate: new Date("2024-08-31T23:59:59Z")
   * expireDate: new Date("2024-12-25T00:00:00Z")
   * expireDate: new Date() // Invalid: current date
   */
  @Prop({
    type: Date,
    required: true,
    min: new Date(),
  })
  expireDate: Date;

  /**
   * Coupon Discount Amount Field
   *
   * The discount value applied when the coupon is used in a transaction.
   * Represents the amount (not percentage) to be deducted from the cart total.
   * Applied to reduce the totalPrice when user applies coupon.
   *
   * @type {number}
   * @required
   * @decorator @Prop
   *
   * @validation
   * - Type: Number
   * - Required: Yes (must be provided)
   * - Format: Numeric value (integer or decimal)
   * - Minimum: 0 (no negative discounts)
   * - No maximum limit (configured by business logic)
   *
   * @remarks
   * - Represents fixed discount amount (currency amount, not percentage)
   * - Directly subtracted from cart totalPrice
   * - Should be less than typical product prices
   * - No percentage validation at schema level
   * - Business logic should prevent discount > cart total
   * - Common values: 5, 10, 20, 50 (varies by currency/business)
   * - Could be extended to support percentage discounts with separate field
   *
   * @example
   * discount: 20 // Deducts $20 from cart
   * discount: 50 // Deducts $50 from cart
   * discount: 100 // Deducts $100 from cart (suitable for high-value orders)
   * discount: 0 // Invalid: no discount value
   *
   * @note Consider implementing:
   * - discountType field: 'fixed' | 'percentage'
   * - Maximum discount cap per coupon
   * - Minimum cart amount required to use coupon
   */
  @Prop({
    type: Number,
    required: true,
  })
  discount: number;
}

/**
 * Coupon Schema Factory
 *
 * Mongoose schema definition created from the Coupon class.
 * Includes automatic timestamp management (createdAt, updatedAt).
 * Used for database operations like create, read, update, delete.
 *
 * @constant {Schema} couponSchema
 *
 * @remarks
 * - Automatically adds createdAt and updatedAt fields
 * - Converts class decorators into MongoDB schema
 * - Enables type-safe database operations
 * - Used in MongooseModule.forFeature() in modules
 * - Supports efficient expiration date queries
 * - Consider adding TTL index on expireDate for automatic cleanup
 *
 * @example
 * MongooseModule.forFeature([
 *   { name: Coupon.name, schema: couponSchema }
 * ])
 *
 * @optimization
 * Consider adding automatic index:
 * couponSchema.index({ expireDate: 1 }, { expireAfterSeconds: 0 });
 * This would automatically remove expired coupons from the collection.
 */
export const couponSchema = SchemaFactory.createForClass(Coupon);
