import {
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/user/user.schema';
import * as bcrypt from 'bcrypt';
import { SignInDto, SignUpDto } from './Dto/auth.dto';
import { JwtService } from '@nestjs/jwt';
const saltOrRounds = 10;
@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
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
}
