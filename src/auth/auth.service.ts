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
const saltOrRounds = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
    private readonly mailService: MailerService,
  ) {}
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

    // 🔥 link
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

    // 🧨 delete reset data
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
