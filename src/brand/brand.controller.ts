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
import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { AuthGuard } from 'src/user/guard/Auth.guard';
import { Roles } from 'src/user/decorator/user.docerator';

/**
 * @fileoverview Brand Controller
 * Handles all brand-related HTTP endpoints including CRUD operations
 * with role-based access control. Restricts creation, update, and deletion
 * to admin users while allowing public read access.
 *
 * @module BrandController
 */

/**
 * Brand Controller
 *
 * Manages brand-related endpoints with role-based access control.
 * Admins can create, update, and delete brands. All users can retrieve brands.
 * All requests are validated using NestJS ValidationPipe.
 *
 * @class BrandController
 * @route v1/brand
 */
@Controller('v1/brand')
export class BrandController {
  /**
   * Creates an instance of BrandController
   *
   * @constructor
   * @param {BrandService} brandService - The brand service instance
   */
  constructor(private readonly brandService: BrandService) {}

  /**
   * Create Brand
   *
   * Creates a new brand record. Restricted to admin users only.
   * Validates brand data and prevents duplicate brand creation.
   *
   * @method
   * @route POST /api/v1/brand
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {CreateBrandDto} createBrandDto - Brand creation data
   * @param {string} createBrandDto.name - Brand name (unique, 3-100 characters)
   * @param {string} [createBrandDto.image] - Brand logo/image URL
   *
   * @returns {Object} Brand creation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand created successfully'
   * @returns {Object} data - Created brand object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {HttpException} 400 - If brand already exists
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Brand name must be unique in the database
   * - Name length: minimum 3, maximum 100 characters
   * - Image is optional
   * - Created timestamp is automatically added
   *
   * @example
   * POST /api/v1/brand
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "Nike",
   *   "image": "https://example.com/nike-logo.png"
   * }
   */
  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    createBrandDto: CreateBrandDto,
  ) {
    return this.brandService.create(createBrandDto);
  }

  /**
   * Get All Brands
   *
   * Retrieves all brands from the database. Public endpoint with no authentication required.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/brand
   * @access Public
   *
   * @returns {Object} All brands response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brands found'
   * @returns {number} length - Total number of brands
   * @returns {Array<Object>} data - Array of brand objects
   * @returns {string} data[].id - Brand unique identifier
   * @returns {string} data[].name - Brand name
   * @returns {string} data[].image - Brand image URL
   * @returns {string} data[].createdAt - Brand creation timestamp
   * @returns {string} data[].updatedAt - Brand last update timestamp
   *
   * @example
   * GET /api/v1/brand
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Brands found",
   *   "length": 5,
   *   "data": [
   *     {
   *       "_id": "507f1f77bcf86cd799439011",
   *       "name": "Nike",
   *       "image": "https://example.com/nike.png",
   *       "createdAt": "2024-01-15T10:30:00Z",
   *       "updatedAt": "2024-01-15T10:30:00Z"
   *     }
   *   ]
   * }
   */
  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  /**
   * Get Single Brand
   *
   * Retrieves a specific brand by ID. Public endpoint with no authentication required.
   * Excludes MongoDB version field (__v) from response.
   *
   * @method
   * @route GET /api/v1/brand/:id
   * @access Public
   *
   * @param {string} id - Brand unique identifier (MongoDB ObjectId)
   *
   * @returns {Object} Brand details response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand found'
   * @returns {Object} data - Brand object
   * @returns {string} data._id - Brand unique identifier
   * @returns {string} data.name - Brand name
   * @returns {string} data.image - Brand image URL
   * @returns {string} data.createdAt - Brand creation timestamp
   * @returns {string} data.updatedAt - Brand last update timestamp
   *
   * @throws {NotFoundException} 404 - If brand with ID not found
   *
   * @example
   * GET /api/v1/brand/507f1f77bcf86cd799439011
   *
   * Response:
   * {
   *   "status": 200,
   *   "message": "Brand found",
   *   "data": {
   *     "_id": "507f1f77bcf86cd799439011",
   *     "name": "Nike",
   *     "image": "https://example.com/nike.png"
   *   }
   * }
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.brandService.findOne(id);
  }

  /**
   * Update Brand
   *
   * Updates an existing brand record. Restricted to admin users only.
   * Can update brand name and/or image. Validates unique name constraint.
   *
   * @method
   * @route PATCH /api/v1/brand/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Brand unique identifier to update
   * @param {UpdateBrandDto} updateBrandDto - Updated brand data
   * @param {string} [updateBrandDto.name] - New brand name (optional)
   * @param {string} [updateBrandDto.image] - New brand image URL (optional)
   *
   * @returns {Object} Brand update response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Brand updated successfully'
   * @returns {Object} data - Updated brand object
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If brand with ID not found
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Only provided fields are updated (partial update)
   * - Brand name must remain unique if updated
   * - Name length validation: minimum 3, maximum 100 characters
   * - Updated timestamp is automatically refreshed
   * - Returns the updated brand object
   *
   * @example
   * PATCH /api/v1/brand/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   * {
   *   "name": "Nike Updated",
   *   "image": "https://example.com/nike-new-logo.png"
   * }
   */
  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateBrandDto: UpdateBrandDto,
  ) {
    return this.brandService.update(id, updateBrandDto);
  }

  /**
   * Delete Brand
   *
   * Deletes a brand record from the database. Restricted to admin users only.
   * Permanently removes the brand and all associated data.
   *
   * @method
   * @route DELETE /api/v1/brand/:id
   * @access Private [Admin only]
   * @guard AuthGuard - Requires valid JWT token
   * @decorator @Roles(['admin']) - Restricts to admin role
   *
   * @param {string} id - Brand unique identifier to delete
   *
   * @returns {void} No content returned on successful deletion
   *
   * @throws {UnauthorizedException} 401 - If JWT token is missing or invalid
   * @throws {ForbiddenException} 403 - If user is not admin
   * @throws {NotFoundException} 404 - If brand with ID not found
   *
   * @remarks
   * - Deletion is permanent and cannot be undone
   * - All references to this brand may need cleanup
   * - Returns HTTP 204 No Content on success
   * - Ensure no products are associated before deletion
   *
   * @example
   * DELETE /api/v1/brand/507f1f77bcf86cd799439011
   * Authorization: Bearer <jwt_token>
   *
   * Response: HTTP 204 No Content
   */
  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.brandService.remove(id);
  }
}
