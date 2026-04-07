/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './user.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
const saltOrRounds = 10;
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}
  //create by admin
  async create(
    createUserDto: CreateUserDto,
  ): Promise<{ status: number; message: string; data: User }> {
    //bussiness logic
    const userExists = await this.userModel.find({
      email: createUserDto.email,
    });
    //if user exists return
    if (!userExists) throw new HttpException('user already exists', 400);

    //create new user

    const password = await bcrypt.hash(createUserDto.password, saltOrRounds);
    const user = {
      password,
      role: createUserDto.role === 'admin' ? 'admin' : 'user',
      active: true,
    };
    return {
      status: 200,
      message: 'user created successfuly',
      data: await this.userModel.create({ ...createUserDto, ...user }),
    };
  }
  //find all by admin
  async findAll(query) {
    const { _limit = 1000, skip = 0, sort = 'asc', name, email, role } = query;

    if (Number.isNaN(Number(+_limit))) {
      throw new HttpException('Invalid limit', 400);
    }
    if (Number.isNaN(Number(+skip))) {
      throw new HttpException('Invalid skip', 400);
    }
    if (!['asc', 'desc'].includes(sort)) {
      throw new HttpException('Invalid sort', 400);
    }

    // or=> whare by all keyword, RegExp=> whare by any keyword
    const users = await this.userModel
      .find()
      .skip(skip)
      .limit(_limit)
      .where('name', new RegExp(name, 'i'))
      .where('email', new RegExp(email, 'i'))
      .where('role', new RegExp(role, 'i'))
      .sort({ name: sort })
      .select(' -password -__v')
      .exec();
    return {
      status: 200,
      message: 'user found successfully',
      length: users.length,
      data: users,
    };
  }
  //find by id only admin
  async findOne(id: string): Promise<{ status: number; data: User }> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return { status: 200, data: user };
  }
  //update by id only admin
  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<{ status: number; message: string; data: User }> {
    const userExists = await this.userModel
      .findById(id)
      .select('-password -__v');
    if (!userExists) {
      throw new NotFoundException('user not found');
    }
    let user = { ...updateUserDto };

    if (updateUserDto.password) {
      const password = await bcrypt.hash(updateUserDto.password, saltOrRounds);
      user = { ...user, password };
    }

    return {
      status: 200,
      message: 'user updated successfully',
      data: <User>await this.userModel.findByIdAndUpdate(id, user, {
        returnDocument: 'after',
      }),
    };
  }
  //recive id and delete user
  async remove(id: string): Promise<{ status: number; message: string }> {
    const user = await this.userModel.findById(id).select('-password -__v');
    if (!user) {
      throw new NotFoundException('user not found');
    }
    await this.userModel.findByIdAndDelete(id);
    return { status: 200, message: 'user DELETED' };
  }

  async getMe(payload) {
    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');
    if (!user) {
      throw new NotFoundException('user not found');
    }
    return { status: 200, message: 'User found', data: user };
  }

  async updateMe(payload, updateUserDto: UpdateUserDto) {
    if (!payload._id) {
      throw new NotFoundException('User not found');
    }

    if (updateUserDto.role) {
      throw new ForbiddenException('forbiden attr change');
    }

    if (updateUserDto.password) {
      const password = await bcrypt.hash(updateUserDto.password, saltOrRounds);
      updateUserDto = { ...updateUserDto, password };
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      status: 200,
      message: 'User updated successfully',
      data: await this.userModel.findByIdAndUpdate(
        payload._id,
        { ...updateUserDto },
        {
          new: true,
        },
      ),
    };
  }

  async deleteMe(payload): Promise<void> {
    if (!payload._id) {
      throw new NotFoundException('user not found');
    }

    const user = await this.userModel
      .findById(payload._id)
      .select('-password -__v');

    if (!user) {
      throw new NotFoundException('user not found');
    }

    await this.userModel.findOneAndUpdate(
      payload._id,
      { active: false },
      { returnDocument: 'after' },
    );
  }
}
