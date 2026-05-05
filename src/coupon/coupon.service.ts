import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon } from './coupon.schema';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

/**
 * @fileoverview Coupon Service
 * Core business logic for discount coupon management including CRUD operations,
 * validation, and database interactions with MongoDB.
 *
 * @module CouponService
 */

/**
 * Coupon Service
 *
 * Provides comprehensive discount coupon management functionality including:
 * - Coupon creation with duplicate prevention
 * - Retrieval of all coupons and individual coupons
 * - Coupon updates with validation
 * - Coupon deletion
 *
 * All operations interact with MongoDB through Mongoose model.
 * Implements validation and error handling for data integrity.
 * Supports discount application in shopping cart operations.
 *
 * @class CouponService
 * @decorator @Injectable
 */
@Injectable()
export class CouponService {
  /**
   * Creates an instance of CouponService
   *
   * @constructor
   * @param {Model<Coupon>} couponModule - Injected Mongoose Coupon model
   */
  constructor(@InjectModel(Coupon.name) private couponModule: Model<Coupon>) {}

  /**
   * Create Coupon
   *
   * Creates a new discount coupon record in the database with duplicate prevention.
   * Validates coupon code is unique before creation.
   * Note: Expiration date validation is performed at the controller level.
   *
   * Process:
   * 1. Query database for existing coupon with same name
   * 2. Throw error if coupon already exists
   * 3. Create new coupon document with provided data
   * 4. Return success response with created coupon
   *
   * @async
   * @method
   * @param {CreateCouponDto} createCouponDto - Coupon creation data
   * @param {string} createCouponDto.name - Coupon code/name (unique, 3-100 characters)
   * @param {Date} createCouponDto.expireDate - Expiration date (must be future date)
   * @param {number} createCouponDto.discount - Discount amount to apply
   *
   * @returns {Promise<Object>} Coupon creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon created successfully'
   * @returns {Object} data - Created coupon object with all fields
   * @returns {string} data._id - MongoDB generated ID
   * @returns {string} data.name - Coupon code
   * @returns {Date} data.expireDate - Expiration date
   * @returns {number} data.discount - Discount amount
   * @returns {Date} data.createdAt - Creation timestamp
   * @returns {Date} data.updatedAt - Last update timestamp
   *
   * @throws {HttpException} 400 - If coupon with same name already exists
   *
   * @remarks
   * - Coupon code uniqueness is case-sensitive
   * - Returns the complete created document
   * - Timestamps are automatically generated
   * - Expiration date validation is done at controller level
   * - Discount value is stored as-is (business logic determines if fixed or percentage)
   *
   * @example
   * const createCouponDto = {
   *   name: "SUMMER20",
   *   expireDate: new Date("2024-08-31T23:59:59Z"),
   *   discount: 20
   * };
   * const result = await couponService.create(createCouponDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async create(createCouponDto: CreateCouponDto) {
    const brand = await this.couponModule.findOne({
      name: createCouponDto.name,
    });
    if (brand) {
      throw new HttpException('Coupon already exist', 400);
    }

    const newCoupon = await this.couponModule.create(createCouponDto);
    return {
      status: 200,
      message: 'Coupon created successfully',
      data: newCoupon,
    };
  }

  /**
   * Get All Coupons
   *
   * Retrieves all discount coupons from the database.
   * Excludes MongoDB version field from response for cleaner output.
   * Includes both active and expired coupons for administrative purposes.
   *
   * Process:
   * 1. Query all coupon documents from database
   * 2. Exclude __v (version) field from results
   * 3. Return array of coupons with metadata
   *
   * @async
   * @method
   *
   * @returns {Promise<Object>} All coupons response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupons found'
   * @returns {number} length - Total count of coupons
   * @returns {Array<Object>} data - Array of coupon objects
   * @returns {string} data[].id - Coupon unique identifier
   * @returns {string} data[].name - Coupon code
   * @returns {Date} data[].expireDate - Expiration date
   * @returns {number} data[].discount - Discount amount
   * @returns {Date} data[].createdAt - Creation timestamp
   * @returns {Date} data[].updatedAt - Last update timestamp
   *
   * @remarks
   * - Returns all coupons regardless of expiration status
   * - Excludes __v field from each coupon
   * - Empty array returned if no coupons exist
   * - Results ordered by MongoDB insertion order
   * - Useful for admin dashboard and coupon management
   *
   * @example
   * const result = await couponService.findAll();
   * // Returns:
   * // {
   * //   status: 200,
   * //   message: 'Coupons found',
   * //   length: 5,
   * //   data: [
   * //     { _id: '...', name: 'SUMMER20', discount: 20, expireDate: '...' },
   * //     { _id: '...', name: 'FREESHIP', discount: 10, expireDate: '...' }
   * //   ]
   * // }
   */
  async findAll() {
    const coupons = await this.couponModule.find().select('-__v');
    return {
      status: 200,
      message: 'Coupons found',
      length: coupons.length,
      data: coupons,
    };
  }

  /**
   * Get Single Coupon by ID
   *
   * Retrieves a specific coupon by its MongoDB ObjectId.
   * Excludes MongoDB version field from response.
   *
   * Process:
   * 1. Query database for coupon with matching ID
   * 2. Exclude __v (version) field
   * 3. Throw error if coupon not found
   * 4. Return success response with coupon data
   *
   * @async
   * @method
   * @param {string} id - Coupon MongoDB ObjectId
   *
   * @returns {Promise<Object>} Coupon details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon found'
   * @returns {Object} data - Coupon object
   * @returns {string} data._id - Coupon unique identifier
   * @returns {string} data.name - Coupon code
   * @returns {Date} data.expireDate - Expiration date
   * @returns {number} data.discount - Discount amount
   *
   * @throws {NotFoundException} 404 - If coupon with ID not found
   *
   * @remarks
   * - ID must be a valid MongoDB ObjectId format
   * - Excludes __v field from response
   * - Returns single coupon object in data field
   * - Case-sensitive query on ID
   *
   * @example
   * const result = await couponService.findOne('507f1f77bcf86cd799439011');
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async findOne(id: string) {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    return {
      status: 200,
      message: 'Coupon found',
      data: coupon,
    };
  }

  /**
   * Update Coupon
   *
   * Updates an existing coupon record with provided data.
   * Performs partial update with only provided fields modified.
   * Note: Expiration date validation is performed at the controller level.
   *
   * Process:
   * 1. Find coupon by ID
   * 2. Throw error if coupon not found
   * 3. Update coupon with new data
   * 4. Return updated coupon object
   *
   * @async
   * @method
   * @param {string} id - Coupon MongoDB ObjectId to update
   * @param {UpdateCouponDto} updateCouponDto - Updated coupon data
   * @param {string} [updateCouponDto.name] - New coupon code (optional)
   * @param {Date} [updateCouponDto.expireDate] - New expiration date (optional)
   * @param {number} [updateCouponDto.discount] - New discount amount (optional)
   *
   * @returns {Promise<Object>} Coupon update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Coupon updated successfully'
   * @returns {Object} data - Updated coupon object with all fields
   * @returns {string} data._id - Coupon unique identifier
   * @returns {string} data.name - Updated coupon code
   * @returns {Date} data.expireDate - Updated expiration date
   * @returns {number} data.discount - Updated discount amount
   *
   * @throws {NotFoundException} 404 - If coupon with ID not found
   *
   * @remarks
   * - Partial update: only provided fields are updated
   * - Other fields retain their existing values
   * - Updated timestamp is automatically refreshed
   * - Returns the updated document
   * - Expiration date validation is done at controller level
   * - No duplicate check for code updates (consider adding)
   *
   * @example
   * const updateCouponDto = {
   *   discount: 25,
   *   expireDate: new Date("2024-09-30T23:59:59Z")
   * };
   * const result = await couponService.update('507f1f77bcf86cd799439011', updateCouponDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async update(id: string, updateCouponDto: UpdateCouponDto) {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    const updatedCoupon = await this.couponModule.findByIdAndUpdate(
      id,
      updateCouponDto,
      {
        returnDocument: 'after',
      },
    );
    return {
      status: 200,
      message: 'Coupon updated successfully',
      data: updatedCoupon,
    };
  }

  /**
   * Delete Coupon
   *
   * Permanently removes a coupon record from the database.
   * Does not return the deleted document.
   * Carts with already-applied coupons will retain the discount.
   *
   * Process:
   * 1. Find coupon by ID to verify existence
   * 2. Throw error if coupon not found
   * 3. Delete coupon from database
   * 4. Return void (no data returned)
   *
   * @async
   * @method
   * @param {string} id - Coupon MongoDB ObjectId to delete
   *
   * @returns {Promise<void>} No data returned
   *
   * @throws {NotFoundException} 404 - If coupon with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - Verify coupon existence before deletion
   * - No data is returned on successful deletion
   * - Carts with applied coupon will retain the discount
   * - Consider implementing soft delete for audit trail
   * - Does not affect existing carts with applied coupon
   *
   * @example
   * await couponService.remove('507f1f77bcf86cd799439011');
   * // No return value, throws if coupon not found
   */
  async remove(id: string): Promise<void> {
    const coupon = await this.couponModule.findById(id).select('-__v');
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    await this.couponModule.findByIdAndDelete(id);
  }
}
