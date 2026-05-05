import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ValidationPipe,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { AuthGuard } from 'src/user/guard/Auth.guard';
import { Roles } from 'src/user/decorator/user.docerator';

/**
 * @fileoverview Coupon Controller
 * Handles all coupon/discount code related HTTP endpoints with admin-only access.
 * Provides CRUD operations for managing discount coupons with expiration validation.
 *
 * @module CouponController
 */

/**
 * Coupon Controller
 *
 * Manages discount coupon endpoints with strict admin-only access control.
 * Only administrators can create, retrieve, update, and delete coupons.
 * Validates coupon expiration dates to ensure coupons are not created with past dates.
 *
 * @class CouponController
 * @route v1/coupon
 */
@Controller('v1/coupon')
export class CouponController {
  /**
   * Creates an instance of CouponController
   *
   * @constructor
   * @param {CouponService} couponService - The coupon service instance
   */
  constructor(private readonly couponService: CouponService) {}

  /**
   * Create Coupon
   *
   * Creates a new discount coupon. Restricted to admin users only.
   * Validates that the coupon expiration date is in the future.
   * Prevents creation of coupons with past or current expiration dates.
   *
   * @method
   * @route POST /api/v1/coupon
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {CreateCouponDto} createCouponDto - Coupon creation data
   * @param {string} createCouponDto.name - Coupon code/name (unique, 3-100 characters)
   * @param {Date} createCouponDto.expireDate - Coupon expiration date (must be future date)
   * @param {number} createCouponDto.discount - Discount amount or percentage
   *
   * @returns {Object} Coupon creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon created successfully'
   * @returns {Object} data - Created coupon object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {HttpException} 400 - If coupon already exists
   * @throws {HttpException} 400 - If expiration date is not in the future
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Coupon name must be unique in the database
   * - Expiration date must be greater than current date/time
   * - Name length: minimum 3, maximum 100 characters
   * - Created timestamp is automatically added
   * - Discount can be fixed amount or percentage (business logic dependent)
   *
   * @example
   * POST /api/v1/coupon
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "SUMMER20",
   *   "expireDate": "2024-08-31T23:59:59Z",
   *   "discount": 20
   * }
   */
  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createCouponDto: CreateCouponDto,
  ) {
    const isExpired = new Date(createCouponDto.expireDate) > new Date();
    if (!isExpired) {
      throw new HttpException("Coupon can't be expired", 400);
    }
    return this.couponService.create(createCouponDto);
  }

  /**
   * Get All Coupons
   *
   * Retrieves all discount coupons. Restricted to admin users only.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/coupon
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @returns {Object} All coupons response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupons found'
   * @returns {number} length - Total number of coupons
   * @returns {Array<Object>} data - Array of coupon objects
   * @returns {string} data[].id - Coupon unique identifier
   * @returns {string} data[].name - Coupon code
   * @returns {Date} data[].expireDate - Coupon expiration date
   * @returns {number} data[].discount - Discount amount
   * @returns {Date} data[].createdAt - Creation timestamp
   * @returns {Date} data[].updatedAt - Last update timestamp
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   *
   * @remarks
   * - Admin only access
   * - Returns all coupons including expired ones
   * - Consider filtering expired coupons in business logic
   *
   * @example
   * GET /api/v1/coupon
   * Authorization: Bearer <admin_jwt_token>
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Coupons found",
   *   "length": 3,
   *   "data": [
   *     {
   *       "_id": "507f1f77bcf86cd799439011",
   *       "name": "SUMMER20",
   *       "discount": 20,
   *       "expireDate": "2024-08-31T23:59:59Z"
   *     }
   *   ]
   * }
   */
  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll() {
    return this.couponService.findAll();
  }

  /**
   * Get Single Coupon
   *
   * Retrieves a specific coupon by ID. Restricted to admin users only.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/coupon/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Coupon unique identifier (MongoDB ObjectId)
   *
   * @returns {Object} Coupon details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon found'
   * @returns {Object} data - Coupon object
   * @returns {string} data._id - Coupon unique identifier
   * @returns {string} data.name - Coupon code
   * @returns {Date} data.expireDate - Coupon expiration date
   * @returns {number} data.discount - Discount amount
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If coupon with ID not found
   *
   * @remarks
   * - Admin only access
   *
   * @example
   * GET /api/v1/coupon/507f1f77bcf86cd799439011
   * Authorization: Bearer <admin_jwt_token>
   */
  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  /**
   * Update Coupon
   *
   * Updates an existing coupon record. Restricted to admin users only.
   * Validates expiration date if being updated to ensure it's in the future.
   *
   * @method
   * @route PATCH /api/v1/coupon/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Coupon unique identifier to update
   * @param {UpdateCouponDto} updateCouponDto - Updated coupon data
   * @param {string} [updateCouponDto.name] - New coupon code (optional)
   * @param {Date} [updateCouponDto.expireDate] - New expiration date (optional, must be future)
   * @param {number} [updateCouponDto.discount] - New discount amount (optional)
   *
   * @returns {Object} Coupon update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon updated successfully'
   * @returns {Object} data - Updated coupon object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If coupon with ID not found
   * @throws {HttpException} 400 - If new expiration date is not in the future
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Only provided fields are updated (partial update)
   * - Expiration date must be future date if updated
   * - Updated timestamp is automatically refreshed
   * - Returns the updated coupon object
   *
   * @example
   * PATCH /api/v1/coupon/507f1f77bcf86cd799439011
   * Authorization: Bearer <admin_jwt_token>
   * {
   *   "discount": 25,
   *   "expireDate": "2024-09-30T23:59:59Z"
   * }
   */
  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateCouponDto: UpdateCouponDto,
  ) {
    if (updateCouponDto.expireDate) {
      const isExpired = updateCouponDto.expireDate
        ? new Date(updateCouponDto.expireDate) > new Date()
        : false;
      if (!isExpired) {
        throw new HttpException("Coupon can't be expired", 400);
      }
    }

    return this.couponService.update(id, updateCouponDto);
  }

  /**
   * Delete Coupon
   *
   * Deletes a coupon record from the database. Restricted to admin users only.
   * Permanently removes the coupon and all associated data.
   *
   * @method
   * @route DELETE /api/v1/coupon/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Coupon unique identifier to delete
   *
   * @returns {void} No content returned on successful deletion
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If coupon with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - Carts with applied coupon will retain the discount
   * - Returns HTTP 204 No Content on success
   * - Admin only access
   *
   * @example
   * DELETE /api/v1/coupon/507f1f77bcf86cd799439011
   * Authorization: Bearer <admin_jwt_token>
   *
   * Response: HTTP 204 No Content
   */
  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }
}
