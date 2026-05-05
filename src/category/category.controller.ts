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
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { AuthGuard } from 'src/user/guard/Auth.guard';
import { Roles } from 'src/user/decorator/user.docerator';

/**
 * @fileoverview Category Controller
 * Handles all category-related HTTP endpoints including CRUD operations
 * with role-based access control. Restricts creation, update, and deletion
 * to admin users while allowing public read access.
 *
 * @module CategoryController
 */

/**
 * Category Controller
 *
 * Manages product category endpoints with role-based access control.
 * Admins can create, update, and delete categories. All users can retrieve categories.
 * All requests are validated using NestJS ValidationPipe.
 *
 * @class CategoryController
 * @route v1/category
 */
@Controller('v1/category')
export class CategoryController {
  /**
   * Creates an instance of CategoryController
   *
   * @constructor
   * @param {CategoryService} categoryService - The category service instance
   */
  constructor(private readonly categoryService: CategoryService) {}

  /**
   * Create Category
   *
   * Creates a new product category record. Restricted to admin users only.
   * Validates category data and prevents duplicate category creation.
   *
   * @method
   * @route POST /api/v1/category
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {CreateCategoryDto} createCategoryDto - Category creation data
   * @param {string} createCategoryDto.name - Category name (unique, 3-40 characters)
   * @param {string} [createCategoryDto.image] - Category image/icon URL
   *
   * @returns {Object} Category creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category created successfully'
   * @returns {Object} data - Created category object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {HttpException} 400 - If category already exists
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Category name must be unique in the database
   * - Name length: minimum 3, maximum 40 characters
   * - Image is optional
   * - Created timestamp is automatically added
   * - Used for product organization and navigation
   *
   * @example
   * POST /api/v1/category
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "Electronics",
   *   "image": "https://example.com/electronics-icon.png"
   * }
   */
  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.create(createCategoryDto);
  }

  /**
   * Get All Categories
   *
   * Retrieves all product categories from the database. Public endpoint with no authentication required.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/category
   * @access Public
   *
   * @returns {Object} All categories response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Categorys found'
   * @returns {number} length - Total number of categories
   * @returns {string} isEmpty - String 'true' or 'false' indicating if collection is empty
   * @returns {Array<Object>} data - Array of category objects
   * @returns {string} data[].id - Category unique identifier
   * @returns {string} data[].name - Category name
   * @returns {string} data[].image - Category image URL
   * @returns {string} data[].createdAt - Category creation timestamp
   * @returns {string} data[].updatedAt - Category last update timestamp
   *
   * @example
   * GET /api/v1/category
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Categorys found",
   *   "length": 5,
   *   "isEmpty": "false",
   *   "data": [
   *     {
   *       "_id": "507f1f77bcf86cd799439011",
   *       "name": "Electronics",
   *       "image": "https://example.com/electronics.png"
   *     }
   *   ]
   * }
   */
  @Get()
  findAll() {
    return this.categoryService.findAll();
  }

  /**
   * Get Single Category
   *
   * Retrieves a specific category by ID. Public endpoint with no authentication required.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/category/:id
   * @access Public
   *
   * @param {string} id - Category unique identifier (MongoDB ObjectId)
   *
   * @returns {Object} Category details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category found'
   * @returns {Object} data - Category object
   * @returns {string} data._id - Category unique identifier
   * @returns {string} data.name - Category name
   * @returns {string} data.image - Category image URL
   * @returns {string} data.createdAt - Category creation timestamp
   * @returns {string} data.updatedAt - Category last update timestamp
   *
   * @throws {NotFoundException} 404 - If category with ID not found
   *
   * @example
   * GET /api/v1/category/507f1f77bcf86cd799439011
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Category found",
   *   "data": {
   *     "_id": "507f1f77bcf86cd799439011",
   *     "name": "Electronics",
   *     "image": "https://example.com/electronics.png"
   *   }
   * }
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  /**
   * Update Category
   *
   * Updates an existing category record. Restricted to admin users only.
   * Can update category name and/or image. Validates unique name constraint.
   *
   * @method
   * @route PATCH /api/v1/category/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Category unique identifier to update
   * @param {UpdateCategoryDto} updateCategoryDto - Updated category data
   * @param {string} [updateCategoryDto.name] - New category name (optional)
   * @param {string} [updateCategoryDto.image] - New category image URL (optional)
   *
   * @returns {Object} Category update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category updated successfully'
   * @returns {Object} data - Updated category object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If category with ID not found
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Only provided fields are updated (partial update)
   * - Category name must remain unique if updated
   * - Name length validation: minimum 3, maximum 40 characters
   * - Updated timestamp is automatically refreshed
   * - Returns the updated category object
   *
   * @example
   * PATCH /api/v1/category/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "Electronics & Gadgets",
   *   "image": "https://example.com/electronics-new.png"
   * }
   */
  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /**
   * Delete Category
   *
   * Deletes a category record from the database. Restricted to admin users only.
   * Permanently removes the category and all associated data.
   *
   * @method
   * @route DELETE /api/v1/category/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Category unique identifier to delete
   *
   * @returns {Object} Deletion response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Category deleted successfully'
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If category with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - All products in this category may need recategorization
   * - Consider soft delete for data recovery capability
   * - Ensure no products reference this category before deletion
   *
   * @example
   * DELETE /api/v1/category/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Category deleted successfully"
   * }
   */
  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
