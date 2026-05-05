/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './cart.schema';
import { Product } from 'src/product/product.schema';
import { Coupon } from 'src/coupon/coupon.schema';
import { UpdateCartItemsDto } from './dto/update-cart-items.dto';

/**
 * @fileoverview Cart Service
 * Core business logic for shopping cart management including adding/removing
 * products, managing quantities, applying coupons, and calculating totals.
 * Handles both user and admin cart operations.
 *
 * @module CartService
 */

/**
 * Cart Service
 *
 * Provides comprehensive shopping cart functionality including:
 * - Adding products to cart with stock validation
 * - Removing and updating cart items
 * - Applying discount coupons
 * - Calculating cart totals with discounts
 * - User and admin cart retrieval
 *
 * Manages relationships between Cart, Product, and Coupon entities.
 * Performs calculations for pricing and discount application.
 *
 * @class CartService
 * @decorator @Injectable
 */
@Injectable()
export class CartService {
  /**
   * Creates an instance of CartService
   *
   * @constructor
   * @param {Model<Cart>} cartModel - Injected Mongoose Cart model
   * @param {Model<Product>} productModel - Injected Mongoose Product model
   * @param {Model<Coupon>} couponModel - Injected Mongoose Coupon model
   */
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
  ) {}

  /**
   * Calculate Cart Totals
   *
   * Private method to calculate total price and discounted total for the cart.
   * Iterates through all cart items, applies product discounts, and calculates totals.
   *
   * Calculation Logic:
   * 1. For each cart item, get product price and discount percentage
   * 2. Calculate final price: price * (1 - discount/100)
   * 3. Accumulate total: quantity * price (full price)
   * 4. Accumulate totalAfterDiscount: quantity * finalPrice (with product discount)
   *
   * @private
   * @method
   * @param {any} cart - Cart object with populated product items
   *
   * @returns {Object} Calculated totals
   * @returns {number} total - Sum of all item prices before product discounts
   * @returns {number} totalAfterDiscount - Sum after product discounts applied
   *
   * @remarks
   * - Does not include coupon discounts (handled separately)
   * - Uses product discount percentage
   * - Handles missing price/discount as 0
   * - Only considers product-level discounts
   *
   * @example
   * const totals = this.calculateTotals(cart);
   * // Returns: { total: 200, totalAfterDiscount: 180 }
   */
  private calculateTotals(cart: any) {
    let total = 0;
    let totalAfterDiscount = 0;

    for (const item of cart.cartItems as any[]) {
      const product = item.productId;

      const price = Number(product.price || 0);
      const discount = Number(product.discount || 0);

      const finalPrice = price * (1 - discount / 100);

      total += item.quantity * price;
      totalAfterDiscount += item.quantity * finalPrice;
    }

    return { total, totalAfterDiscount };
  }

  /**
   * Add Product to Cart
   *
   * Adds a product to user's cart or increments quantity if already present.
   * Creates new cart if user doesn't have one. Validates product availability.
   *
   * Process:
   * 1. Verify product exists and has stock
   * 2. Find or create user's cart
   * 3. Check if product already in cart
   * 4. Verify adding would not exceed available stock
   * 5. Add or increment product quantity
   * 6. Populate product data for price calculation
   * 7. Calculate new totals
   * 8. Save cart
   *
   * @async
   * @method
   * @param {Types.ObjectId} productId - MongoDB ObjectId of product to add
   * @param {Types.ObjectId} userId - User who owns the cart
   *
   * @returns {Promise<Object>} Cart update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Cart updated successfully'
   * @returns {Object} data - Updated cart object
   *
   * @throws {NotFoundException} 404 - If product not found
   * @throws {NotFoundException} - If product out of stock
   * @throws {NotFoundException} - If adding would exceed available stock
   *
   * @remarks
   * - Creates cart if user doesn't have one
   * - Increments quantity if product already in cart
   * - Validates stock before every addition
   * - Product quantity minimum is 1
   * - Recalculates totals after addition
   *
   * @example
   * const result = await cartService.create(
   *   new ObjectId("507f1f77bcf86cd799439011"),
   *   new ObjectId("507f1f77bcf86cd799439012")
   * );
   */
  async create(productId: Types.ObjectId, userId: Types.ObjectId) {
    const product = await this.productModel.findById(productId);

    if (!product) throw new NotFoundException('Product not found');

    if (product.quantity <= 0) {
      throw new NotFoundException('Out of stock');
    }

    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        cartItems: [],
      });
    }

    const index = cart.cartItems.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    const currentQty = index !== -1 ? cart.cartItems[index].quantity : 0;

    if (currentQty + 1 > product.quantity) {
      throw new NotFoundException('Not enough stock');
    }

    if (index !== -1) {
      cart.cartItems[index].quantity += 1;
    } else {
      cart.cartItems.push({
        productId,
        quantity: 1,
        color: '',
      } as any);
    }

    await cart.populate('cartItems.productId', 'price discount');

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Cart updated successfully',
      data: cart,
    };
  }

  /**
   * Get User's Cart
   *
   * Retrieves the shopping cart for a specific user with populated product details.
   * Includes product price, title, and description for each cart item.
   *
   * @async
   * @method
   * @param {Types.ObjectId} user_id - User's MongoDB ObjectId
   *
   * @returns {Promise<Object>} Cart retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found Cart'
   * @returns {Object} data - Cart with populated product details
   *
   * @throws {NotFoundException} 404 - If user cart not found
   *
   * @remarks
   * - Returns cart with populated product information
   * - Excludes __v version field
   * - Returns null if user has no cart
   * - Includes all applied coupons
   *
   * @example
   * const result = await cartService.findOne(new ObjectId("507f1f77bcf86cd799439012"));
   */
  async findOne(user_id: Types.ObjectId) {
    const cart = await this.cartModel
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price title description')
      .select('-__v');
    if (!cart) {
      throw new NotFoundException(
        `You don't hava a cart please go to add prducts`,
      );
    }

    return {
      status: 200,
      message: 'Found Cart',
      data: cart,
    };
  }

  /**
   * Apply Coupon to Cart
   *
   * Applies a discount coupon to user's cart with validation.
   * Prevents duplicate coupon usage and validates coupon status.
   *
   * Process:
   * 1. Find user's cart
   * 2. Find coupon by name
   * 3. Validate coupon exists and not expired
   * 4. Check coupon not already applied
   * 5. Add coupon to cart
   * 6. Reduce cart total by coupon discount amount
   * 7. Save cart
   *
   * @async
   * @method
   * @param {Types.ObjectId} user_id - User who owns the cart
   * @param {string} couponName - Coupon code/name to apply
   *
   * @returns {Promise<Object>} Coupon application response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon Applied'
   * @returns {Object} data - Updated cart with coupon applied
   *
   * @throws {NotFoundException} 404 - If cart not found
   * @throws {HttpException} 400 - If coupon invalid or expired
   * @throws {HttpException} 400 - If coupon already used in cart
   * @throws {HttpException} 400 - If cart already has full discount
   *
   * @remarks
   * - Coupon must not be expired
   * - Each coupon can only be used once per cart
   * - Cannot apply if cart already has 0 or negative total
   * - Directly reduces totalPrice by coupon discount amount
   * - Stores coupon reference for tracking
   *
   * @example
   * const result = await cartService.applyCoupon(
   *   new ObjectId("507f1f77bcf86cd799439012"),
   *   "SUMMER20"
   * );
   */
  async applyCoupon(user_id: Types.ObjectId, couponName: string) {
    const cart = await this.cartModel.findOne({ user: user_id });
    const coupon = await this.couponModel.findOne({ name: couponName });

    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }
    if (!coupon) {
      throw new HttpException('Invalid coupon', 400);
    }
    const isExpired = new Date(coupon.expireDate) > new Date();
    if (!isExpired) {
      throw new HttpException('Invalid coupon', 400);
    }

    const ifCouponAlredyUsed = cart.coupons.findIndex(
      (item) => item.name === couponName,
    );
    if (ifCouponAlredyUsed !== -1) {
      throw new HttpException('Coupon alredy used', 400);
    }

    if (cart.totalPrice <= 0) {
      throw new HttpException('You have full discount', 400);
    }

    cart.coupons.push({
      name: coupon.name,
      couponId: coupon._id.toString(),
    });
    cart.totalPrice = cart.totalPrice - coupon.discount;
    await cart.save();

    return {
      status: 200,
      message: 'Coupon Applied',
      data: cart,
    };
  }

  /**
   * Update Cart Item
   *
   * Updates quantity and/or color for a product in the cart.
   * Validates stock availability for quantity changes.
   * Removes item if quantity set to 0 or less.
   *
   * Process:
   * 1. Find user's cart with populated products
   * 2. If no cart exists, create one by adding product
   * 3. Find product and verify it exists
   * 4. Find cart item index
   * 5. Update color and/or quantity
   * 6. Validate stock if increasing quantity
   * 7. Remove item if quantity <= 0
   * 8. Recalculate totals
   * 9. Save cart
   *
   * @async
   * @method
   * @param {Types.ObjectId} productId - Product to update
   * @param {Types.ObjectId} user_id - User's cart to update
   * @param {UpdateCartItemsDto} updateCartItemsDto - Update data
   * @param {number} [updateCartItemsDto.quantity] - New quantity
   * @param {string} [updateCartItemsDto.color] - New color selection
   *
   * @returns {Promise<Object>} Update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Product Updated'
   * @returns {Object} data - Updated cart
   *
   * @throws {NotFoundException} 404 - If product not found
   * @throws {NotFoundException} 404 - If product not in cart
   * @throws {NotFoundException} - If quantity exceeds available stock
   *
   * @remarks
   * - Quantity 0 or less removes item from cart
   * - Can update color independently
   * - Validates stock before quantity increase
   * - Recalculates totals after any change
   * - Creates cart if doesn't exist
   *
   * @example
   * const result = await cartService.update(
   *   new ObjectId("507f1f77bcf86cd799439011"),
   *   new ObjectId("507f1f77bcf86cd799439012"),
   *   { quantity: 5, color: "black" }
   * );
   */
  async update(
    productId: Types.ObjectId,
    user_id: Types.ObjectId,
    updateCartItemsDto: UpdateCartItemsDto,
  ) {
    const cart = await this.cartModel
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price discount quantity');

    if (!cart) {
      return this.create(productId, user_id);
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const index = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (index === -1) {
      throw new NotFoundException('Product not in cart');
    }

    const cartItem = cart.cartItems[index];

    if (updateCartItemsDto.color !== undefined) {
      cartItem.color = updateCartItemsDto.color;
    }

    if (updateCartItemsDto.quantity !== undefined) {
      const newQty = updateCartItemsDto.quantity;

      if (newQty <= 0) {
        cart.cartItems.splice(index, 1);
      } else {
        if (newQty > product.quantity) {
          throw new NotFoundException('Not enough stock');
        }

        cartItem.quantity = newQty;
      }
    }

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Product Updated',
      data: cart,
    };
  }

  /**
   * Remove Product from Cart
   *
   * Removes one unit of a product from the user's cart.
   * Removes item completely if quantity becomes 0.
   *
   * Process:
   * 1. Find user's cart with populated products
   * 2. Find product in cart
   * 3. Decrement quantity by 1
   * 4. Remove item if quantity becomes 0
   * 5. Recalculate totals
   * 6. Save cart
   *
   * @async
   * @method
   * @param {Types.ObjectId} productId - Product to remove
   * @param {Types.ObjectId} userId - User's cart
   *
   * @returns {Promise<Object>} Removal response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Cart updated successfully'
   * @returns {Object} data - Updated cart
   *
   * @throws {NotFoundException} 404 - If cart not found
   * @throws {NotFoundException} 404 - If product not in cart
   *
   * @remarks
   * - Decrements quantity by exactly 1
   * - Removes item if quantity reaches 0
   * - Recalculates totals
   * - Cannot remove more than available quantity
   *
   * @example
   * const result = await cartService.remove(
   *   new ObjectId("507f1f77bcf86cd799439011"),
   *   new ObjectId("507f1f77bcf86cd799439012")
   * );
   */
  async remove(productId: Types.ObjectId, userId: Types.ObjectId) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('cartItems.productId', 'price discount');

    if (!cart) throw new NotFoundException('Cart not found');

    const index = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (index === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    if (cart.cartItems[index].quantity > 1) {
      cart.cartItems[index].quantity -= 1;
    } else {
      cart.cartItems.splice(index, 1);
    }

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Cart updated successfully',
      data: cart,
    };
  }

  /**
   * Get User Cart (Admin)
   *
   * Admin method to retrieve any user's cart by user ID.
   * Used for admin overview and management.
   *
   * @async
   * @method
   * @param {string} userId - User's MongoDB ObjectId
   *
   * @returns {Promise<Object>} Cart retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found Cart'
   * @returns {Object} data - User's cart with product details
   *
   * @throws {NotFoundException} 404 - If cart not found
   *
   * @remarks
   * - Admin only method
   * - Returns specified user's cart
   * - Includes populated product information
   *
   * @example
   * const result = await cartService.findOneForAdmin("507f1f77bcf86cd799439012");
   */
  async findOneForAdmin(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('cartItems.productId', 'price title description');
    if (!cart) {
      throw new NotFoundException('Not Found Cart');
    }
    return {
      status: 200,
      message: 'Found Cart',
      data: cart,
    };
  }

  /**
   * Get All Carts (Admin)
   *
   * Admin method to retrieve all shopping carts in the system.
   * Includes user and coupon information with populated references.
   *
   * @async
   * @method
   *
   * @returns {Promise<Object>} All carts retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found All Carts'
   * @returns {number} length - Total number of carts
   * @returns {Array<Object>} data - All carts with details
   *
   * @remarks
   * - Admin only method
   * - Returns all carts in the system
   * - Populates user, product, and coupon details
   * - Useful for analytics and monitoring
   * - Large result set possible with many users
   *
   * @example
   * const result = await cartService.findAllForAdmin();
   */
  async findAllForAdmin() {
    const carts = await this.cartModel
      .find()
      .select('-__v')
      .populate(
        'cartItems.productId user coupons.couponId',
        'name email expireDate price title description',
      );
    return {
      status: 200,
      message: 'Found All Carts',
      length: carts.length,
      data: carts,
    };
  }
}
