import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './category.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

/**
 * @fileoverview Category Service
 * Core business logic for category management including CRUD operations,
 * validation, and database interactions with MongoDB.
 *
 * @module CategoryService
 */

/**
 * Category Service
 *
 * Provides comprehensive product category management functionality including:
 * - Category creation with duplicate prevention
 * - Retrieval of all categories and individual categories
 * - Category updates with validation
 * - Category deletion
 *
 * All operations interact with MongoDB through Mongoose model.
 * Implements validation and error handling for data integrity.
 *
 * @class CategoryService
 * @decorator @Injectable
 */
@Injectable()
export class CategoryService {
  /**
   * Creates an instance of CategoryService
   *
   * @constructor
   * @param {Model<Category>} categoryModel - Injected Mongoose Category model
   */
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<Category>,
  ) {}

  /**
   * Create Category
   *
   * Creates a new product category record in the database with duplicate prevention.
   * Validates category name is unique (case-insensitive) before creation.
   *
   * Process:
   * 1. Convert category name to lowercase for case-insensitive duplicate check
   * 2. Query database for existing category with same name
   * 3. Throw error if category already exists
   * 4. Create new category document with provided data
   * 5. Return success response with created category
   *
   * @async
   * @method
   * @param {CreateCategoryDto} createCategoryDto - Category creation data
   * @param {string} createCategoryDto.name - Category name (will be checked for uniqueness)
   * @param {string} [createCategoryDto.image] - Category image URL (optional)
   *
   * @returns {Promise<Object>} Category creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category created successfully'
   * @returns {Object} data - Created category object with all fields
   * @returns {string} data._id - MongoDB generated ID
   * @returns {string} data.name - Category name
   * @returns {string} data.image - Category image URL
   * @returns {Date} data.createdAt - Creation timestamp
   * @returns {Date} data.updatedAt - Last update timestamp
   *
   * @throws {HttpException} 400 - If category with same name already exists
   *
   * @remarks
   * - Name uniqueness check is case-insensitive (converted to lowercase)
   * - Returns the complete created document
   * - Timestamps are automatically generated
   * - Image field is optional
   * - Used for product organization and filtering
   *
   * @example
   * const createCategoryDto = {
   *   name: "Electronics",
   *   image: "https://example.com/electronics.png"
   * };
   * const result = await categoryService.create(createCategoryDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async create(createCategoryDto: CreateCategoryDto) {
    const category = await this.categoryModel.findOne({
      name: createCategoryDto.name.toLowerCase(),
    });

    if (category) {
      throw new HttpException('Category already exist', 400);
    }

    const newCategory = await this.categoryModel.create(createCategoryDto);
    return {
      status: 200,
      message: 'Category created successfully',
      data: newCategory,
    };
  }

  /**
   * Get All Categories
   *
   * Retrieves all product categories from the database.
   * Excludes MongoDB version field from response for cleaner output.
   * Includes metadata about collection size and empty status.
   *
   * Process:
   * 1. Query all category documents from database
   * 2. Exclude __v (version) field from results
   * 3. Return array of categories with metadata
   *
   * @async
   * @method
   *
   * @returns {Promise<Object>} All categories response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Categorys found'
   * @returns {number} length - Total count of categories
   * @returns {string} isEmpty - String 'false' if categories exist, 'true' if empty
   * @returns {Array<Object>} data - Array of category objects
   * @returns {string} data[].id - Category unique identifier
   * @returns {string} data[].name - Category name
   * @returns {string} data[].image - Category image URL
   * @returns {Date} data[].createdAt - Category creation timestamp
   * @returns {Date} data[].updatedAt - Category last update timestamp
   *
   * @remarks
   * - Returns all categories regardless of count
   * - Excludes __v field from each category
   * - Empty array returned if no categories exist
   * - Results ordered by MongoDB insertion order
   * - Used for navigation menus and product filtering
   *
   * @example
   * const result = await categoryService.findAll();
   * // Returns:
   * // {
   * //   status: 200,
   * //   message: 'Categorys found',
   * //   length: 5,
   * //   isEmpty: 'false',
   * //   data: [
   * //     { _id: '...', name: 'Electronics', image: '...', ... },
   * //     { _id: '...', name: 'Clothing', image: '...', ... }
   * //   ]
   * // }
   */
  async findAll() {
    const category = await this.categoryModel.find().select('-__v');
    return {
      status: 200,
      message: 'Categorys found',
      length: category.length,
      isEmpty: category.length > 0 ? 'false' : 'true',
      data: category,
    };
  }

  /**
   * Get Single Category by ID
   *
   * Retrieves a specific category by its MongoDB ObjectId.
   * Excludes MongoDB version field from response.
   *
   * Process:
   * 1. Query database for category with matching ID
   * 2. Exclude __v (version) field
   * 3. Throw error if category not found
   * 4. Return success response with category data
   *
   * @async
   * @method
   * @param {string} _id - Category MongoDB ObjectId
   *
   * @returns {Promise<Object>} Category details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category found'
   * @returns {Object} data - Category object
   * @returns {string} data._id - Category unique identifier
   * @returns {string} data.name - Category name
   * @returns {string} data.image - Category image URL
   * @returns {Date} data.createdAt - Category creation timestamp
   * @returns {Date} data.updatedAt - Category last update timestamp
   *
   * @throws {NotFoundException} 404 - If category with ID not found
   *
   * @remarks
   * - ID must be a valid MongoDB ObjectId format
   * - Excludes __v field from response
   * - Returns single category object in data field
   * - Case-sensitive query on ID
   *
   * @example
   * const result = await categoryService.findOne('507f1f77bcf86cd799439011');
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async findOne(_id: string) {
    const category = await this.categoryModel.findOne({ _id }).select('-__v');
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      status: 200,
      message: 'Category found',
      data: category,
    };
  }

  /**
   * Update Category
   *
   * Updates an existing category record with provided data.
   * Performs partial update with only provided fields modified.
   *
   * Process:
   * 1. Find category by ID
   * 2. Throw error if category not found
   * 3. Update category with new data
   * 4. Return updated category object
   *
   * @async
   * @method
   * @param {string} _id - Category MongoDB ObjectId to update
   * @param {UpdateCategoryDto} updateCategoryDto - Updated category data
   * @param {string} [updateCategoryDto.name] - New category name (optional)
   * @param {string} [updateCategoryDto.image] - New category image URL (optional)
   *
   * @returns {Promise<Object>} Category update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category updated successfully'
   * @returns {Object} data - Updated category object with all fields
   * @returns {string} data._id - Category unique identifier
   * @returns {string} data.name - Updated category name
   * @returns {string} data.image - Updated category image
   * @returns {Date} data.updatedAt - New update timestamp
   *
   * @throws {NotFoundException} 404 - If category with ID not found
   *
   * @remarks
   * - Partial update: only provided fields are updated
   * - Other fields retain their existing values
   * - Updated timestamp is automatically refreshed
   * - Returns the updated document
   * - No duplicate check for name updates (consider adding)
   * - Used for category information maintenance
   *
   * @example
   * const updateCategoryDto = {
   *   name: "Electronics & Gadgets",
   *   image: "https://example.com/electronics-new.png"
   * };
   * const result = await categoryService.update('507f1f77bcf86cd799439011', updateCategoryDto);
   * // Returns: { status: 200, message: '...', data: {...} }
   */
  async update(_id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findOne({ _id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate({ _id }, updateCategoryDto, { new: true })
      .select('-__v');

    return {
      status: 200,
      message: 'Category updated successfully',
      data: updatedCategory,
    };
  }

  /**
   * Delete Category
   *
   * Permanently removes a category record from the database.
   * Does not return the deleted document.
   *
   * Process:
   * 1. Find category by ID to verify existence
   * 2. Throw error if category not found
   * 3. Delete category from database
   * 4. Return success message
   *
   * @async
   * @method
   * @param {string} _id - Category MongoDB ObjectId to delete
   *
   * @returns {Promise<Object>} Deletion response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category deleted successfully'
   *
   * @throws {NotFoundException} 404 - If category with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - Verify category existence before deletion
   * - Products in this category may need recategorization
   * - Consider implementing soft delete for data recovery
   * - Check for product references before deletion
   *
   * @example
   * await categoryService.remove('507f1f77bcf86cd799439011');
   * // Returns: { status: 200, message: 'Category deleted successfully' }
   */
  async remove(_id: string) {
    const category = await this.categoryModel.findOne({ _id });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    await this.categoryModel.deleteOne({ _id });
    return {
      status: 200,
      message: 'Category deleted successfully',
    };
  }
}
