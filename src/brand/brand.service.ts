import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Brand } from './brand.schema';

/**
 * @fileoverview Brand Service
 * Core business logic for brand management including CRUD operations,
 * validation, and database interactions with MongoDB.
 *
 * @module BrandService
 */

/**
 * Brand Service
 *
 * Provides comprehensive brand management functionality including:
 * - Brand creation with duplicate prevention
 * - Retrieval of all brands and individual brands
 * - Brand updates with validation
 * - Brand deletion
 *
 * All operations interact with MongoDB through Mongoose model.
 * Implements validation and error handling for data integrity.
 *
 * @class BrandService
 * @decorator @Injectable
 */
@Injectable()
export class BrandService {
  /**
   * Creates an instance of BrandService
   *
   * @constructor
   * @param {Model<Brand>} brandModel - Injected Mongoose Brand model
   */
  constructor(@InjectModel(Brand.name) private brandModel: Model<Brand>) {}

  /**
   * Create Brand
   *
   * Creates a new brand record in the database with duplicate prevention.
   * Validates brand name is unique before creation.
   *
   * Process:
   * 1. Convert brand name to lowercase for case-insensitive duplicate check
   * 2. Query database for existing brand with same name
   * 3. Throw error if brand already exists
   * 4. Create new brand document with provided data
   * 5. Return success response with created brand
   *
   * @async
   * @method
   * @param {CreateBrandDto} createBrandDto - Brand creation data
   * @param {string} createBrandDto.name - Brand name (will be checked for uniqueness)
   * @param {string} [createBrandDto.image] - Brand image URL (optional)
   *
   * @returns {Promise<Object>} Brand creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand created successfully'
   * @returns {Object} data - Created brand object with all fields
   * @returns {string} data._id - MongoDB generated ID
   * @returns {string} data.name - Brand name
   * @returns {string} data.image - Brand image URL
   * @returns {Date} data.createdAt - Creation timestamp
   * @returns {Date} data.updatedAt - Last update timestamp
   *
   * @throws {HttpException} 400 - If brand with same name already exists
   *
   * @remarks
   * - Name uniqueness check is case-insensitive (converted to lowercase)
   * - Returns the complete created document
   * - Timestamps are automatically generated
   * - Image field is optional
   *
   * @example
   * const createBrandDto = {
   *   name: "Nike",
   *   image: "https://example.com/nike.png"
   * };
   * const result = await brandService.create(createBrandDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async create(createBrandDto: CreateBrandDto) {
    const brand = await this.brandModel.findOne({
      name: createBrandDto.name.toLowerCase(),
    });

    if (brand) {
      throw new HttpException('Brand already exist', 400);
    }

    const newBrand = await this.brandModel.create(createBrandDto);
    return {
      status: 200,
      message: 'Brand created successfully',
      data: newBrand,
    };
  }

  /**
   * Get All Brands
   *
   * Retrieves all brands from the database.
   * Excludes MongoDB version field from response for cleaner output.
   *
   * Process:
   * 1. Query all brand documents from database
   * 2. Exclude __v (version) field from results
   * 3. Return array of brands with metadata
   *
   * @async
   * @method
   *
   * @returns {Promise<Object>} All brands response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brands found'
   * @returns {number} length - Total count of brands
   * @returns {Array<Object>} data - Array of brand objects
   * @returns {string} data[].id - Brand unique identifier
   * @returns {string} data[].name - Brand name
   * @returns {string} data[].image - Brand image URL
   * @returns {Date} data[].createdAt - Brand creation timestamp
   * @returns {Date} data[].updatedAt - Brand last update timestamp
   *
   * @remarks
   * - Returns all brands regardless of count
   * - Excludes __v field from each brand
   * - Empty array returned if no brands exist
   * - Results ordered by MongoDB insertion order
   *
   * @example
   * const result = await brandService.findAll();
   * // Returns:
   * // {
   * //   status: 200,
   * //   message: 'Brands found',
   * //   length: 5,
   * //   data: [
   * //     { _id: '...', name: 'Nike', image: '...', ... },
   * //     { _id: '...', name: 'Adidas', image: '...', ... }
   * //   ]
   * // }
   */
  async findAll() {
    const brands = await this.brandModel.find().select('-__v');
    return {
      status: 200,
      message: 'Brands found',
      length: brands.length,
      data: brands,
    };
  }

  /**
   * Get Single Brand by ID
   *
   * Retrieves a specific brand by its MongoDB ObjectId.
   * Excludes MongoDB version field from response.
   *
   * Process:
   * 1. Query database for brand with matching ID
   * 2. Exclude __v (version) field
   * 3. Throw error if brand not found
   * 4. Return success response with brand data
   *
   * @async
   * @method
   * @param {string} id - Brand MongoDB ObjectId
   *
   * @returns {Promise<Object>} Brand details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand found'
   * @returns {Object} data - Brand object
   * @returns {string} data._id - Brand unique identifier
   * @returns {string} data.name - Brand name
   * @returns {string} data.image - Brand image URL
   * @returns {Date} data.createdAt - Brand creation timestamp
   * @returns {Date} data.updatedAt - Brand last update timestamp
   *
   * @throws {NotFoundException} 404 - If brand with ID not found
   *
   * @remarks
   * - ID must be a valid MongoDB ObjectId format
   * - Excludes __v field from response
   * - Returns single brand object in data field
   *
   * @example
   * const result = await brandService.findOne('507f1f77bcf86cd799439011');
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async findOne(id: string) {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    return {
      status: 200,
      message: 'Brand found',
      data: brand,
    };
  }

  /**
   * Update Brand
   *
   * Updates an existing brand record with provided data.
   * Performs partial update with only provided fields modified.
   *
   * Process:
   * 1. Find brand by ID
   * 2. Throw error if brand not found
   * 3. Update brand with new data
   * 4. Return updated brand object
   *
   * @async
   * @method
   * @param {string} id - Brand MongoDB ObjectId to update
   * @param {UpdateBrandDto} updateBrandDto - Updated brand data
   * @param {string} [updateBrandDto.name] - New brand name (optional)
   * @param {string} [updateBrandDto.image] - New brand image URL (optional)
   *
   * @returns {Promise<Object>} Brand update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand updated successfully'
   * @returns {Object} data - Updated brand object with all fields
   * @returns {string} data._id - Brand unique identifier
   * @returns {string} data.name - Updated brand name
   * @returns {string} data.image - Updated brand image
   * @returns {Date} data.updatedAt - New update timestamp
   *
   * @throws {NotFoundException} 404 - If brand with ID not found
   *
   * @remarks
   * - Partial update: only provided fields are updated
   * - Other fields retain their existing values
   * - Updated timestamp is automatically refreshed
   * - Returns the updated document
   * - No duplicate check for name updates (consider adding)
   *
   * @example
   * const updateBrandDto = {
   *   name: "Nike Updated",
   *   image: "https://example.com/nike-new.png"
   * };
   * const result = await brandService.update('507f1f77bcf86cd799439011', updateBrandDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async update(id: string, updateBrandDto: UpdateBrandDto) {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const updatedBrand = await this.brandModel.findByIdAndUpdate(
      id,
      updateBrandDto,
      {
        new: true,
      },
    );
    return {
      status: 200,
      message: 'Brand updated successfully',
      data: updatedBrand,
    };
  }

  /**
   * Delete Brand
   *
   * Permanently removes a brand record from the database.
   * Does not return the deleted document.
   *
   * Process:
   * 1. Find brand by ID to verify existence
   * 2. Throw error if brand not found
   * 3. Delete brand from database
   * 4. Return void (no data returned)
   *
   * @async
   * @method
   * @param {string} id - Brand MongoDB ObjectId to delete
   *
   * @returns {Promise<void>} No data returned
   *
   * @throws {NotFoundException} 404 - If brand with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - Verify brand existence before deletion
   * - No data is returned on successful deletion
   * - Consider implementing soft delete for data recovery
   * - Check for product references before deletion
   *
   * @example
   * await brandService.remove('507f1f77bcf86cd799439011');
   * // No return value, throws if brand not found
   */
  async remove(id: string): Promise<void> {
    const brand = await this.brandModel.findById(id).select('-__v');
    if (!brand) {
      throw new NotFoundException('Brand not found');
    }
    await this.brandModel.findByIdAndDelete(id);
  }
}
