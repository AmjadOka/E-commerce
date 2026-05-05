import { Body, Controller, Post, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ResetPasswordDto, SignInDto, SignUpDto } from './Dto/auth.dto';

/**
 * @fileoverview Authentication Controller
 * Handles all authentication-related HTTP endpoints including user registration,
 * login, password reset, and password change operations.
 *
 * @module AuthController
 */

/**
 * Authentication Controller
 *
 * Manages all authentication endpoints for the application.
 * Provides public access to sign up, sign in, and password reset operations,
 * with proper request validation using NestJS ValidationPipe.
 *
 * @class AuthController
 * @route v1/auth
 */
@Controller('v1/auth')
export class AuthController {
  /**
   * Creates an instance of AuthController
   *
   * @constructor
   * @param {AuthService} authService - The authentication service instance
   */
  constructor(private readonly authService: AuthService) {}

  /**
   * User Registration Endpoint
   *
   * Registers a new user account with email and password.
   * Validates input data and prevents registration of duplicate emails.
   *
   * @async
   * @method
   * @route POST /api/v1/auth/sign-up
   * @access Public
   *
   * @param {SignUpDto} signUpDto - User registration data
   * @param {string} signUpDto.email - User email address (must be unique)
   * @param {string} signUpDto.password - User password (should be hashed)
   * @param {string} signUpDto.name - User's full name
   *
   * @returns {Promise<Object>} Registration response
   * @returns {number} status - HTTP status code (200)
   * @returns {string} message - Success message
   * @returns {Object} data - Created user object
   * @returns {string} access_token - JWT authentication token
   *
   * @throws {HttpException} 400 - If user already exists with the same email
   * @throws {BadRequestException} - If validation fails
   *
   * @example
   * POST /api/v1/auth/sign-up
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123",
   *   "name": "John Doe"
   * }
   */
  @Post('sign-up')
  signUp(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    signUpDto: SignUpDto,
  ) {
    return this.authService.signUp(signUpDto);
  }

  /**
   * User Login Endpoint
   *
   * Authenticates a user using email and password credentials.
   * Validates credentials against stored hashed passwords.
   * Issues JWT token upon successful authentication.
   *
   * @async
   * @method
   * @route POST /api/v1/auth/sign-in
   * @access Public
   *
   * @param {SignInDto} signInDto - User login credentials
   * @param {string} signInDto.email - User email address
   * @param {string} signInDto.password - User password (plain text)
   *
   * @returns {Promise<Object>} Login response
   * @returns {number} status - HTTP status code (200)
   * @returns {string} message - Success message
   * @returns {Object} data - Authenticated user object
   * @returns {string} access_token - JWT authentication token
   *
   * @throws {NotFoundException} 404 - If user with email not found
   * @throws {UnauthorizedException} 401 - If password is incorrect
   * @throws {BadRequestException} - If validation fails
   *
   * @example
   * POST /api/v1/auth/sign-in
   * {
   *   "email": "user@example.com",
   *   "password": "SecurePassword123"
   * }
   */
  @Post('sign-in')
  async signIn(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    signInDto: SignInDto,
  ) {
    return this.authService.signIn(signInDto);
  }

  /**
   * Password Reset Request Endpoint
   *
   * Initiates password reset process by sending a reset code and link to user's email.
   * Generates secure reset token and verification code with 10-minute expiration.
   *
   * @async
   * @method
   * @route POST /api/v1/auth/reset-password
   * @access Public
   *
   * @param {ResetPasswordDto} email - User email for password reset
   * @param {string} email.email - The email address of the account to reset
   *
   * @returns {Promise<Object>} Reset initiation response
   * @returns {number} status - HTTP status code (200)
   * @returns {string} message - Confirmation message
   *
   * @throws {NotFoundException} 404 - If user with email not found
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Sends email containing reset code and reset link
   * - Reset code and link valid for 10 minutes
   * - User must verify code before changing password
   *
   * @example
   * POST /api/v1/auth/reset-password
   * {
   *   "email": "user@example.com"
   * }
   */
  @Post('reset-password')
  async resetPassword(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    email: ResetPasswordDto,
  ) {
    return this.authService.resetPassword(email);
  }

  /**
   * Verify Reset Code Endpoint
   *
   * Validates the reset code sent to user's email during password reset process.
   * Code must match and not be expired.
   *
   * @async
   * @method
   * @route POST /api/v1/auth/verify-code
   * @access Private (for users)
   *
   * @param {Object} verifyCode - Verification data
   * @param {string} verifyCode.email - User email address
   * @param {string} verifyCode.code - The 6-digit verification code
   *
   * @returns {Promise<Object>} Verification response
   * @returns {number} status - HTTP status code (200)
   * @returns {string} message - Success message
   *
   * @throws {BadRequestException} 400 - If code is invalid or expired
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Code is case-sensitive
   * - Code expires after 10 minutes
   * - Sets isResetVerified flag for subsequent password change
   *
   * @example
   * POST /api/v1/auth/verify-code
   * {
   *   "email": "user@example.com",
   *   "code": "123456"
   * }
   */
  @Post('verify-code')
  verifyCode(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    verifyCode: {
      email: string;
      code: string;
    },
  ) {
    return this.authService.verifyResetCode(verifyCode);
  }

  /**
   * Change Password Endpoint
   *
   * Updates user password using a valid reset token received after code verification.
   * Hashes new password and clears reset data from database.
   *
   * @async
   * @method
   * @route POST /api/v1/auth/change-password
   * @access Private (for users: admin and regular users)
   *
   * @param {Object} changePassword - Password change data
   * @param {string} changePassword.token - Reset token from password reset email
   * @param {string} changePassword.newPassword - New password to set
   *
   * @returns {Promise<Object>} Password change response
   * @returns {string} message - Success message
   *
   * @throws {BadRequestException} 400 - If token is invalid or expired
   * @throws {BadRequestException} - If user hasn't verified reset code
   * @throws {BadRequestException} - If validation fails
   *
   * @remarks
   * - Token must be verified through verify-code endpoint first
   * - Token expires after 10 minutes
   * - Clears all reset-related data after successful password change
   * - New password is automatically hashed with bcrypt (10 rounds)
   *
   * @example
   * POST /api/v1/auth/change-password
   * {
   *   "token": "abc123def456ghi789jkl012mno345",
   *   "newPassword": "NewSecurePassword123"
   * }
   */
  @Post('change-password')
  changePassword(
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    changePassword: {
      token: string;
      newPassword: string;
    },
  ) {
    console.log(changePassword);
    return this.authService.changePassword(
      changePassword.token,
      changePassword.newPassword,
    );
  }
}
