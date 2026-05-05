import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartItemsDto } from './dto/update-cart-items.dto';
import { Roles } from 'src/user/decorator/user.docerator';
import { AuthGuard } from 'src/user/guard/Auth.guard';

import { Request } from 'express';
import { Types } from 'mongoose';

/**
 * @fileoverview Cart Controller
 * Handles shopping cart operations for users and admin access.
 * Provides endpoints for adding/removing products, managing quantities,
 * applying coupons, and retrieving cart information.
 *
 * @module CartController
 */

/**
 * Extended Express Request with Authentication Data
 *
 * Custom request interface that includes authenticated user information.
 * Used to access user ID and role from JWT token in protected routes.
 *
 * @interface AuthRequest
 * @extends {Request}
 */
export interface AuthRequest extends Request {
  /**
   * Authenticated user information
   *
   * @type {Object}
   * @property {Types.ObjectId} _id - User's unique identifier
   * @property {string} role - User's role ('admin' or 'user')
   * @property {string} email - User's email address
   */
  user: {
    _id: Types.ObjectId;
    role: string;
    email: string;
  };
}

/**
 * Cart Controller
 *
 * Manages shopping cart operations with separate endpoints for users and admins.
 * User endpoints allow cart management for their own cart while admin endpoints
 * provide administrative access to any user's cart.
 *
 * @class CartController
 * @route v1/cart
 */
@Controller('v1/cart')
export class CartController {
  /**
   * Creates an instance of CartController
   *
   * @constructor
   * @param {CartService} cartService - The cart service instance
   */
  constructor(private readonly cartService: CartService) {}

  /**
   * Add Product to Cart
   *
   * Adds a product to the user's shopping cart or increments quantity if product exists.
   * Creates a new cart if user doesn't have one. Validates product availability.
   *
   * @method
   * @route POST /api/v1/cart/:productId
   * @access Private [User role only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['user']) - Restricts to user role
   *
   * @param {Types.ObjectId} productId - MongoDB ObjectId of product to add
   * @param {AuthRequest} req - Request with authenticated user data
   *
   * @returns {Object} Cart update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Cart updated successfully'
   * @returns {Object} data - Updated cart object
   * @returns {Array} data.cartItems - Items in the cart
   * @returns {number} data.totalPrice - Total price before discounts
   * @returns {number} data.totalPriceAfterDiscount - Total with discounts applied
   *
   * @throws {UnauthorizedException} 401 - If user is admin
   * @throws {NotFoundException} 404 - If product not found
   * @throws {NotFoundException} - If product is out of stock
   *
   * @remarks
   * - Admin users are blocked from this endpoint
   * - Creates cart if user doesn't have one
   * - Increments quantity if product already in cart
   * - Validates product stock availability
   * - Recalculates totals after addition
   *
   * @example
   * POST /api/v1/cart/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   */
  @Post(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Param('productId') productId: Types.ObjectId,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.create(productId, user_id);
  }

  /**
   * Apply Coupon to Cart
   *
   * Applies a discount coupon to the user's cart. Validates coupon existence,
   * expiration status, and prevents duplicate coupon usage.
   *
   * @method
   * @route POST /api/v1/cart/coupon/:couponName
   * @access Private [User role only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['user']) - Restricts to user role
   *
   * @param {string} couponName - Name of the coupon to apply
   * @param {AuthRequest} req - Request with authenticated user data
   *
   * @returns {Object} Coupon application response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon Applied'
   * @returns {Object} data - Updated cart with coupon applied
   * @returns {Array} data.coupons - Array of applied coupons
   * @returns {number} data.totalPrice - Reduced total price
   *
   * @throws {UnauthorizedException} 401 - If user is admin
   * @throws {NotFoundException} 404 - If cart not found
   * @throws {HttpException} 400 - If coupon invalid or expired
   * @throws {HttpException} 400 - If coupon already used
   * @throws {HttpException} 400 - If already has full discount
   *
   * @remarks
   * - Admin users are blocked from this endpoint
   * - Coupon must not be expired
   * - Coupon can only be used once per cart
   * - Coupon cannot be applied if cart total is already zero
   * - Total price is immediately reduced
   *
   * @example
   * POST /api/v1/cart/coupon/SUMMER20
   * Authorization: Bearer <jwt_token>
   */
  @Post('/coupon/:couponName')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  applyCoupon(
    @Param('couponName') couponName: string,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.applyCoupon(user_id, couponName);
  }

  /**
   * Get User's Cart
   *
   * Retrieves the shopping cart for the authenticated user.
   * Populates product details from references.
   *
   * @method
   * @route GET /api/v1/cart
   * @access Private [User role only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['user']) - Restricts to user role
   *
   * @param {AuthRequest} req - Request with authenticated user data
   *
   * @returns {Object} Cart retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found Cart'
   * @returns {Object} data - Cart object with populated items
   * @returns {Array} data.cartItems - Cart items with product details
   * @returns {number} data.totalPrice - Total before discounts
   * @returns {number} data.totalPriceAfterDiscount - Total after discounts
   * @returns {Array} data.coupons - Applied coupons
   *
   * @throws {UnauthorizedException} 401 - If user is admin
   * @throws {NotFoundException} 404 - If user cart not found
   *
   * @remarks
   * - Admin users are blocked from this endpoint
   * - Returns user's cart with populated product data
   * - Includes title, price, and description for each item
   *
   * @example
   * GET /api/v1/cart
   * Authorization: Bearer <jwt_token>
   */
  @Get()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  findOneForUser(@Req() req: AuthRequest) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.findOne(user_id);
  }

  /**
   * Update Cart Item
   *
   * Updates quantity and/or color for a product in the user's cart.
   * Validates stock availability for quantity changes.
   *
   * @method
   * @route PATCH /api/v1/cart/:productId
   * @access Private [User role only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['user']) - Restricts to user role
   *
   * @param {Types.ObjectId} productId - MongoDB ObjectId of product to update
   * @param {UpdateCartItemsDto} updateCartItemsDto - Update data
   * @param {number} [updateCartItemsDto.quantity] - New quantity
   * @param {string} [updateCartItemsDto.color] - Product color selection
   * @param {AuthRequest} req - Request with authenticated user data
   *
   * @returns {Object} Cart update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Product Updated'
   * @returns {Object} data - Updated cart object
   *
   * @throws {UnauthorizedException} 401 - If user is admin
   * @throws {NotFoundException} 404 - If product not in cart
   * @throws {NotFoundException} - If quantity exceeds available stock
   *
   * @remarks
   * - Admin users are blocked from this endpoint
   * - Quantity 0 or less removes item from cart
   * - Validates stock before allowing quantity increase
   * - Can update color without affecting other fields
   *
   * @example
   * PATCH /api/v1/cart/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   * {
   *   "quantity": 5,
   *   "color": "black"
   * }
   */
  @Patch(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(
    @Param('productId') productId: Types.ObjectId,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateCartItemsDto: UpdateCartItemsDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.update(productId, user_id, updateCartItemsDto);
  }

  /**
   * Remove Product from Cart
   *
   * Removes one unit of a product from the user's cart.
   * Completely removes item if quantity becomes 0.
   *
   * @method
   * @route DELETE /api/v1/cart/:id
   * @access Private [User role only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['user']) - Restricts to user role
   *
   * @param {Types.ObjectId} productId - MongoDB ObjectId of product to remove
   * @param {AuthRequest} req - Request with authenticated user data
   *
   * @returns {Object} Cart removal response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Cart updated successfully'
   * @returns {Object} data - Updated cart object
   *
   * @throws {UnauthorizedException} 401 - If user is admin
   * @throws {NotFoundException} 404 - If product not in cart
   *
   * @remarks
   * - Admin users are blocked from this endpoint
   * - Decrements quantity by 1
   * - Removes item completely if quantity becomes 0
   * - Recalculates totals after removal
   *
   * @example
   * DELETE /api/v1/cart/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   */
  @Delete(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('id') productId: Types.ObjectId, @Req() req: AuthRequest) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;

    return this.cartService.remove(productId, user_id);
  }

  /**
   * Get User Cart (Admin)
   *
   * Admin endpoint to retrieve any user's shopping cart by user ID.
   * Used for admin overview of specific user's cart.
   *
   * @method
   * @route GET /api/v1/cart/admin/:userId
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} userId - User's MongoDB ObjectId
   *
   * @returns {Object} Cart retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found Cart'
   * @returns {Object} data - User's cart with product details
   *
   * @throws {UnauthorizedException} 401 - If not admin
   * @throws {NotFoundException} 404 - If user cart not found
   *
   * @remarks
   * - Admin only access
   * - Can retrieve any user's cart
   * - Includes all product details
   *
   * @example
   * GET /api/v1/cart/admin/507f1f77bcf86cd799439011
   * Authorization: Bearer <admin_jwt_token>
   */
  @Get('/admin/:userId')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOneForAdmin(@Param('userId') userId: string) {
    return this.cartService.findOneForAdmin(userId);
  }

  /**
   * Get All Carts (Admin)
   *
   * Admin endpoint to retrieve all shopping carts in the system.
   * Includes user and coupon information.
   *
   * @method
   * @route GET /api/v1/cart/admin
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @returns {Object} All carts retrieval response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Found All Carts'
   * @returns {number} length - Total number of carts
   * @returns {Array<Object>} data - Array of all carts with details
   *
   * @throws {UnauthorizedException} 401 - If not admin
   *
   * @remarks
   * - Admin only access
   * - Returns all carts in the system
   * - Includes populated user and coupon information
   * - Useful for analytics and monitoring
   *
   * @example
   * GET /api/v1/cart/admin
   * Authorization: Bearer <admin_jwt_token>
   */
  @Get('/admin')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAllForAdmin() {
    return this.cartService.findAllForAdmin();
  }
}
