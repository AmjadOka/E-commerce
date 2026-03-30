/* eslint-disable @typescript-eslint/no-unsafe-member-access */
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
  Req,
  Query,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from './guard/Auth.guard';
import { Roles } from './decorator/user.docerator';

@Controller('v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  //@docs Admin Can create Users
  //@Route POST  /api/v1/user
  //access private [admin]
  @Post()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  create(
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    createUserDto: CreateUserDto,
  ) {
    return this.userService.create(createUserDto);
  }
  //@docs Admin Can get All Users
  //@Route GET  /api/v1/user
  //access private [admin]
  @Get()
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAll(@Query() query) {
    return this.userService.findAll(query);
  }
  //@docs Admin Can get one User
  //@Route GET  /api/v1/user/:id
  //access private [admin]
  @Get(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }
  //@docs Admin Can update single Users
  //@Route UPDATE  /api/v1/user
  //access private [admin]
  @Patch(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  update(
    @Param('id') id: string,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true }))
    updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }
  //@docs Admin Can delete single Users
  //@Route DELETE  /api/v1/user
  //access private [admin]
  @Delete(':id')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
}
@Controller('v1/userMe')
export class UserMeController {
  constructor(private readonly userService: UserService) {}

  // For User
  // @docs  Any User can get data on your account
  // @Route GET /api/v1/user/me
  // @access Private [user, admin]

  @Get()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  getMe(@Req() req) {
    return this.userService.getMe(req.user);
  }

  //@docs Any User can update data on your account
  //@Route patch /api/v1/userMe
  //@access Private [user, admin]
  @Patch()
  @Roles(['user', 'admin'])
  @UseGuards(AuthGuard)
  updateMe(
    @Req() req,
    @Body(
      new ValidationPipe({
        forbidNonWhitelisted: true,
      }),
    )
    updateUserDto: UpdateUserDto,
  ) {
    return this.userService.updateMe(req.user, updateUserDto);
  }

  //@docs Any User can unActive your account
  //@Route patch /api/v1/user/me
  //@access Private [user, admin]
  @Delete()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  deleteMe(@Req() req) {
    return this.userService.deleteMe(req.user);
  }
}
