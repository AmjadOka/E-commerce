/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  BadRequestException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/user.schema';
import * as bcrypt from 'bcrypt';
import { ResetPasswordDto, SignInDto, SignUpDto } from './Dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import * as crypto from 'crypto';

/**
 * @fileoverview Authentication Service
 * Core business logic for all authentication operations including user
 * registration, login, password reset, and password change functionality.
 * Handles password hashing with bcrypt, JWT token generation, and email
 * notifications for password reset operations.
 *
 * @module AuthService
 */

/** Bcrypt salt rounds for password hashing */
const saltOrRounds = 10;

/**
 * Authentication Service
 *
 * Provides comprehensive authentication functionality including:
 * - User registration with email validation and password hashing
 * - User login with credential verification
 * - Password reset with token and code generation
 * - Reset code verification
 * - Password change with secure token validation
 *
 * Uses bcrypt for password security and JWT for token generation.
 * Implements email-based password reset flow with time-limited tokens and codes.
 *
 * @class AuthService
 * @decorator @Injectable
 */
@Injectable()
export class AuthService {
  /**
   * Creates an instance of AuthService
   *
   * @constructor
   * @param {Model<User>} userModel - Injected Mongoose User model
   * @param {JwtService} jwtService - Injected JWT service for token generation
   * @param {MailerService} mailService - Injected mailer service for email notifications
   */
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}

  /**
   * User Registration/Sign Up
   *
   * Creates a new user account with email validation and password hashing.
   * Generates a JWT token upon successful registration.
   *
   * Process:
   * 1. Check if user already exists with the provided email
   * 2. Hash the password using bcrypt with 10 salt rounds
   * 3. Create new user document with default role 'user' and active status
   * 4. Generate JWT token with user data
   * 5. Return created user and access token
   *
   * @async
   * @method
   * @param {SignUpDto} signUpDto - User registration data
   * @param {string} signUpDto.email - User email (must be unique)
   * @param {string} signUpDto.password - Plain text password
   * @param {string} signUpDto.name - User's full name
   *
   * @returns {Promise<Object>} Registration response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'User created successfully'
   * @returns {Object} data - Created user object (without password)
   * @returns {string} access_token - JWT token for authentication
   *
   * @throws {HttpException} 400 - If user with email already exists
   *
   * @remarks
   * - Email must be unique in the database
   * - Password is hashed with bcrypt before storage
   * - New users are assigned 'user' role by default
   * - New users are set to active by default
   * - JWT token includes: _id, email, role
   * - Token secret is read from process.env.JWT_SECRET
   *
   * @example
   * const signUpDto = {
   *   email: 'newuser@example.com',
   *   password: 'SecurePassword123',
   *   name: 'John Doe'
   * };
   * const result = await authService.signUp(signUpDto);
   * // Returns: { status: 200, message: '...', data: {...}, access_token: 'jwt...' }
   */
  async signUp(signUpDto: SignUpDto) {
    const user = await this.userModel.findOne({ email: signUpDto.email });
    if (user) {
      throw new HttpException('User already exist', 400);
    }
    const password = await bcrypt.hash(signUpDto.password, saltOrRounds);
    const userCreated = {
      password,
      role: 'user',
      active: true,
    };
    const newUser = await this.userModel.create({
      ...signUpDto,
      ...userCreated,
    });

    const payload = {
      _id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });
    return {
      status: 200,
      message: 'User created successfully',
      data: newUser,
      access_token: token,
    };
  }

  /**
   * User Login/Sign In
   *
   * Authenticates a user using email and password credentials.
   * Validates password against stored hash and generates JWT token on success.
   *
   * Process:
   * 1. Find user by email
   * 2. Compare provided password with stored hash using bcrypt
   * 3. Generate JWT token with user data
   * 4. Return authenticated user and access token
   *
   * @async
   * @method
   * @param {SignInDto} signInDto - User login credentials
   * @param {string} signInDto.email - User email address
   * @param {string} signInDto.password - Plain text password
   *
   * @returns {Promise<Object>} Login response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'user logged successfully'
   * @returns {Object} data - Authenticated user object
   * @returns {string} access_token - JWT token for authenticated requests
   *
   * @throws {NotFoundException} 404 - If user with email not found
   * @throws {UnauthorizedException} 401 - If password is incorrect
   *
   * @remarks
   * - User must exist in database
   * - Password comparison is case-sensitive
   * - JWT token includes: _id, email, role
   * - Token secret is read from process.env.JWT_SECRET
   * - Failed login attempts are not rate-limited (consider adding for security)
   *
   * @example
   * const signInDto = {
   *   email: 'user@example.com',
   *   password: 'SecurePassword123'
   * };
   * const result = await authService.signIn(signInDto);
   * // Returns: { status: 200, message: '...', data: {...}, access_token: 'jwt...' }
   */
  async signIn(signInDto: SignInDto) {
    const user = await this.userModel.findOne({ email: signInDto.email });
    if (!user) {
      throw new NotFoundException('user not found');
    }
    const isMatch = await bcrypt.compare(signInDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException();
    }
    const payload = {
      _id: user._id,
      email: user.email,
      role: user.role,
    };
    const token = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_SECRET,
    });
    return {
      status: 200,
      message: 'user logged successfully',
      data: user,
      access_token: token,
    };
  }

  /**
   * Reset Password Request
   *
   * Initiates password reset process by generating a reset token and code,
   * storing them in the database, and sending an email to the user with
   * reset instructions.
   *
   * Process:
   * 1. Find user by email
   * 2. Generate secure random reset token (32 bytes)
   * 3. Hash the token using SHA256
   * 4. Generate random 6-digit verification code
   * 5. Set token hash, code, expiration (10 minutes), and verification flag in user
   * 6. Save user document
   * 7. Send email with code and reset link
   *
   * @async
   * @method
   * @param {ResetPasswordDto} resetPasswordDto - Reset request data
   * @param {string} resetPasswordDto.email - User email address
   *
   * @returns {Promise<Object>} Reset initiation response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Reset email sent successfully'
   *
   * @throws {NotFoundException} 404 - If user with email not found
   *
   * @remarks
   * - Reset token and code expire after 10 minutes (600000ms)
   * - Token is hashed with SHA256 before storage for security
   * - Email contains both verification code and reset link
   * - Reset link includes raw token as query parameter
   * - isResetVerified is initially set to false
   * - Email is sent via configured mailer service (NodeMailer)
   * - Reset token is only valid after code verification
   *
   * @example
   * const result = await authService.resetPassword({
   *   email: 'user@example.com'
   * });
   * // User receives email with reset code and link
   */
  async resetPassword({ email }: ResetPasswordDto) {
    const user = await this.userModel.findOne({ email });
    console.log(email, 'ds');
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    user.resetTokenHash = tokenHash;
    user.resetCode = code;
    user.resetExpires = new Date(Date.now() + 10 * 60 * 1000);
    user.isResetVerified = false;

    await user.save();

    // link
    const resetLink = `http://localhost:3000/reset-password?token=${rawToken}`;

    //  sending via nodeMailer
    await this.mailService.sendMail({
      from: 'e-commerce NestJs',
      to: user.email,
      subject: 'Password Reset',
      html: `
      <h3>Password Reset Request</h3>
      <p>Your verification code is:</p>
      <h2>${code}</h2>
      <p>Click the link below to continue:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 10 minutes</p>
    `,
    });

    return {
      status: 200,
      message: 'Reset email sent successfully',
    };
  }

  /**
   * Verify Reset Code
   *
   * Validates the 6-digit verification code sent to user's email.
   * Sets isResetVerified flag to allow password change.
   *
   * Process:
   * 1. Find user with matching email and non-expired reset token
   * 2. Verify provided code matches stored code
   * 3. Set isResetVerified to true
   * 4. Save user document
   *
   * @async
   * @method
   * @param {Object} verifyCodeData - Verification data
   * @param {string} verifyCodeData.email - User email address
   * @param {string} verifyCodeData.code - 6-digit verification code
   *
   * @returns {Promise<Object>} Verification response
   * @returns {number} status - HTTP status code 200
   * @returns {string} message - 'Code verified successfully'
   *
   * @throws {BadRequestException} 400 - If code is invalid or expired
   *
   * @remarks
   * - Code must match exactly (case and value)
   * - Code must not be expired (resetExpires > now)
   * - Verification is required before password change
   * - After verification, user has 10 minutes to complete password change
   * - Only verified resets can proceed to password change
   *
   * @example
   * const result = await authService.verifyResetCode({
   *   email: 'user@example.com',
   *   code: '123456'
   * });
   * // Returns: { status: 200, message: 'Code verified successfully' }
   */
  async verifyResetCode({ email, code }) {
    const user = await this.userModel.findOne({
      email,
      resetExpires: { $gt: new Date() },
    });

    if (!user || user.resetCode !== code) {
      throw new BadRequestException('Invalid or expired code');
    }

    user.isResetVerified = true;
    await user.save();

    return {
      status: 200,
      message: 'Code verified successfully',
    };
  }

  /**
   * Change Password
   *
   * Updates user password after reset token validation and code verification.
   * Hashes new password and clears all reset-related data from database.
   *
   * Process:
   * 1. Hash the reset token using SHA256
   * 2. Find user with matching token hash, non-expired token, and verified status
   * 3. Hash new password with bcrypt
   * 4. Update user password
   * 5. Clear reset token hash, code, expiration, and verification flag
   * 6. Save user document
   *
   * @async
   * @method
   * @param {string} token - Raw reset token from password reset email
   * @param {string} newPassword - New password to set
   *
   * @returns {Promise<Object>} Password change response
   * @returns {string} message - 'Password changed successfully'
   *
   * @throws {BadRequestException} 400 - If token is invalid, expired, or not verified
   *
   * @remarks
   * - Token must be verified through verifyResetCode first
   * - Token must not be expired (resetExpires > now)
   * - New password is hashed with bcrypt (10 rounds)
   * - All reset data is cleared after successful password change
   * - User can immediately login with new password
   * - Token hash is compared using SHA256 for security
   * - This is the final step in password reset flow
   *
   * @example
   * const result = await authService.changePassword(
   *   'abc123def456ghi789jkl012mno345',
   *   'NewSecurePassword123'
   * );
   * // Returns: { message: 'Password changed successfully' }
   */
  async changePassword(token, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.userModel.findOne({
      resetTokenHash: tokenHash,
      resetExpires: { $gt: new Date() },
      isResetVerified: true,
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired request');
    }

    user.password = await bcrypt.hash(newPassword, 10);

    // delete reset data
    user.resetTokenHash = undefined;
    user.resetCode = undefined;
    user.resetExpires = undefined;
    user.isResetVerified = false;

    await user.save();

    return {
      message: 'Password changed successfully',
    };
  }
}
