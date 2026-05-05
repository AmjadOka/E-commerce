/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { User, userSchema } from 'src/user/user.schema';

/**
 * @fileoverview Authentication Module
 * Encapsulates authentication-related functionality including controllers,
 * services, and database schema imports for user authentication operations.
 *
 * @module AuthModule
 */

/**
 * Authentication Module
 *
 * Provides authentication functionality including user registration, login,
 * password reset, and password change operations. Integrates MongoDB through
 * Mongoose for user data persistence.
 *
 * Imports the User schema for database operations and exports AuthService
 * for use in other modules requiring authentication functionality.
 *
 * @class AuthModule
 * @decorator @Module
 *
 * @example
 * // In app.module.ts
 * import { AuthModule } from './auth/auth.module';
 *
 * @Module({
 *   imports: [AuthModule],
 * })
 * export class AppModule {}
 */
@Module({
  /**
   * Module imports array
   *
   * Imports MongoDB schema through Mongoose for the User entity,
   * making the User model available for injection throughout the module.
   *
   * @type {Array}
   */
  imports: [
    /**
     * Mongoose feature registration for User schema
     *
     * Registers the User schema with Mongoose and makes the User model
     * available for dependency injection in controllers and services.
     *
     * @param {string} name - The name of the model ('User')
     * @param {Schema} schema - The Mongoose schema definition (userSchema)
     */
    MongooseModule.forFeature([{ name: User.name, schema: userSchema }]),
  ],

  /**
   * Module controllers array
   *
   * Declares the AuthController which handles all HTTP requests
   * related to authentication operations.
   *
   * @type {Array}
   * @see AuthController
   */
  controllers: [AuthController],

  /**
   * Module providers array
   *
   * Declares the AuthService which provides the business logic
   * for authentication operations and is injectable throughout the module.
   *
   * @type {Array}
   * @see AuthService
   */
  providers: [AuthService],
})
export class AuthModule {}
