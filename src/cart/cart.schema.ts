import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { Product } from 'src/product/product.schema';
import { User } from 'src/user/user.schema';
import { Coupon } from 'src/coupon/coupon.schema';

/**
 * @fileoverview Cart Schema Definition
 * Defines the MongoDB schema for shopping cart documents including cart items,
 * applied coupons, and price calculations.
 *
 * @module CartSchema
 */

/**
 * Cart Document Type
 *
 * Type definition for a Mongoose hydrated Cart document.
 * Provides TypeScript type safety for cart documents retrieved from MongoDB.
 *
 * @typedef {HydratedDocument<Cart>} CartDocument
 *
 * @example
 * const cart: CartDocument = await cartModel.findById(id);
 */
export type CartDocument = HydratedDocument<Cart>;

/**
 * Cart Item Subdocument
 *
 * Structure for individual items stored in cart.
 * Contains product reference, quantity, and optional color selection.
 *
 * @typedef {Object} CartItem
 * @property {Types.ObjectId} productId - Reference to Product document
 * @property {number} quantity - Number of units in cart (minimum 1)
 * @property {string} [color] - Selected product color (optional)
 *
 * @example
 * {
 *   productId: new ObjectId("507f1f77bcf86cd799439011"),
 *   quantity: 2,
 *   color: "black"
 * }
 */

/**
 * Applied Coupon Subdocument
 *
 * Structure for coupons applied to the cart.
 * Stores coupon name and reference for discount tracking.
 *
 * @typedef {Object} AppliedCoupon
 * @property {string} name - Coupon code/name
 * @property {string} couponId - Reference to Coupon document
 *
 * @example
 * {
 *   name: "SUMMER20",
 *   couponId: "507f1f77bcf86cd799439011"
 * }
 */

/**
 * Cart Schema Class
 *
 * Defines the structure and validation rules for shopping cart documents in MongoDB.
 * Cart entities represent user shopping carts in the e-commerce system.
 *
 * Fields:
 * - user: Reference to User document (required)
 * - cartItems: Array of items with product references
 * - coupons: Array of applied discount coupons
 * - totalPrice: Sum of all item prices before discounts
 * - totalPriceAfterDiscount: Sum after discount application
 * - Automatic timestamps (createdAt, updatedAt)
 *
 * @class Cart
 * @decorator @Schema({ timestamps: true })
 *
 * @property {Types.ObjectId} _id - Cart unique identifier
 * @property {Types.ObjectId} user - User who owns the cart
 * @property {Array<CartItem>} cartItems - Products in the cart
 * @property {Array<AppliedCoupon>} coupons - Applied discount coupons
 * @property {number} totalPrice - Total before discounts
 * @property {number} totalPriceAfterDiscount - Total after discounts
 *
 * @example
 * const cartDoc = {
 *   _id: new ObjectId(),
 *   user: new ObjectId("507f1f77bcf86cd799439012"),
 *   cartItems: [
 *     {
 *       productId: new ObjectId("507f1f77bcf86cd799439011"),
 *       quantity: 2,
 *       color: "black"
 *     }
 *   ],
 *   coupons: [
 *     {
 *       name: "SUMMER20",
 *       couponId: new ObjectId("507f1f77bcf86cd799439013")
 *     }
 *   ],
 *   totalPrice: 200,
 *   totalPriceAfterDiscount: 160,
 *   createdAt: "2024-01-15T10:30:00Z",
 *   updatedAt: "2024-01-15T10:30:00Z"
 * };
 */
@Schema({ timestamps: true })
export class Cart {
  /**
   * Cart Unique Identifier
   *
   * MongoDB generated unique ID for the cart document.
   * Automatically set by Mongoose on document creation.
   *
   * @type {Types.ObjectId}
   * @readonly
   *
   * @example
   * _id: ObjectId("507f1f77bcf86cd799439011")
   */
  _id: Types.ObjectId;

  /**
   * User Reference Field
   *
   * Reference to the User document who owns this cart.
   * Establishes relationship between User and Cart collections.
   *
   * @type {Types.ObjectId}
   * @required
   * @decorator @Prop
   *
   * @validation
   * - Type: MongoDB ObjectId
   * - Required: Yes (must reference a valid User)
   * - Ref: 'User' - Uses User collection
   *
   * @remarks
   * - One cart per user relationship
   * - Cannot be null or empty
   * - Must reference valid User document
   * - Used for user-specific cart retrieval
   *
   * @example
   * user: ObjectId("507f1f77bcf86cd799439012")
   */
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: User.name,
    required: true,
  })
  user: Types.ObjectId;

  /**
   * Cart Items Array
   *
   * Array of products and their quantities in the shopping cart.
   * Each item contains product reference, quantity, and optional color.
   *
   * @type {Array<{productId: Types.ObjectId, quantity: number, color?: string}>}
   * @decorator @Prop
   *
   * @property {Types.ObjectId} productId - Reference to Product document (required)
   * @property {number} quantity - Number of units (required, minimum 1)
   * @property {string} [color] - Selected product color (optional, default empty string)
   *
   * @validation
   * - productId: Valid Product reference (required)
   * - quantity: Integer >= 1
   * - color: String (optional)
   *
   * @remarks
   * - Empty array initially when cart is created
   * - Duplicate products increment quantity, not added as separate items
   * - Quantity must be positive integer
   * - Color is optional variant selector
   * - Can contain multiple variants of same product
   *
   * @example
   * cartItems: [
   *   {
   *     productId: ObjectId("507f1f77bcf86cd799439011"),
   *     quantity: 2,
   *     color: "black"
   *   },
   *   {
   *     productId: ObjectId("507f1f77bcf86cd799439014"),
   *     quantity: 1,
   *     color: ""
   *   }
   * ]
   */
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

  /**
   * Applied Coupons Array
   *
   * Array of discount coupons applied to the cart.
   * Each coupon entry stores the coupon name and reference.
   *
   * @type {Array<{name: string, couponId: string}>}
   * @decorator @Prop
   *
   * @property {string} name - Coupon code/name
   * @property {string} couponId - Reference to Coupon document
   *
   * @remarks
   * - Empty array initially
   * - Each coupon can only be applied once per cart
   * - Stores reference for tracking which coupons are applied
   * - Multiple coupons can be applied (if business logic allows)
   * - Coupons are removed if they expire or user requests
   *
   * @example
   * coupons: [
   *   {
   *     name: "SUMMER20",
   *     couponId: "507f1f77bcf86cd799439013"
   *   },
   *   {
   *     name: "FREESHIP",
   *     couponId: "507f1f77bcf86cd799439014"
   *   }
   * ]
   */
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

  /**
   * Total Price Field
   *
   * Sum of all product prices in the cart before discount application.
   * Calculated as: sum of (product.price * quantity) for all items.
   *
   * @type {number}
   * @default 0
   * @decorator @Prop
   *
   * @remarks
   * - Does not include coupon discounts
   * - Recalculated on cart updates
   * - Minimum value is 0
   * - Should be recalculated whenever cart items change
   * - Uses product base price without discounts
   *
   * @example
   * // If cart has:
   * // - Product A: $50, quantity 2
   * // - Product B: $30, quantity 1
   * totalPrice: 130 // (50*2) + (30*1)
   */
  @Prop({ default: 0 })
  totalPrice: number;

  /**
   * Total Price After Discount Field
   *
   * Sum of all item prices in the cart after individual product discounts
   * and coupon applications. Calculated as: totalPrice - coupon_discounts.
   *
   * @type {number}
   * @default 0
   * @decorator @Prop
   *
   * @remarks
   * - Includes individual product discount percentages
   * - Reduces by coupon discount amounts
   * - Always <= totalPrice
   * - Recalculated on cart and coupon updates
   * - Final amount user pays
   *
   * @example
   * // If totalPrice is 130
   * // Product discount reduces 10: 120
   * // Coupon discount reduces 20: 100
   * totalPriceAfterDiscount: 100
   */
  @Prop({ default: 0 })
  totalPriceAfterDiscount: number;
}

/**
 * Cart Schema Factory
 *
 * Mongoose schema definition created from the Cart class.
 * Includes automatic timestamp management (createdAt, updatedAt).
 * Used for database operations like create, read, update, delete.
 *
 * @constant {Schema} cartSchema
 *
 * @remarks
 * - Automatically adds createdAt and updatedAt fields
 * - Converts class decorators into MongoDB schema
 * - Enables type-safe database operations
 * - Used in MongooseModule.forFeature() in modules
 * - Maintains relationships with User, Product, and Coupon collections
 *
 * @example
 * MongooseModule.forFeature([
 *   { name: Cart.name, schema: cartSchema }
 * ])
 */
export const cartSchema = SchemaFactory.createForClass(Cart);
