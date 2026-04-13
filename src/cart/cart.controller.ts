import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { UpdateCartItemsDto } from './dto/update-cart-items.dto';
import { Roles } from 'src/user/decorator/user.docerator';
import { AuthGuard } from 'src/user/guard/Auth.guard';

import { Request } from 'express';
import { Types } from 'mongoose';

export interface AuthRequest extends Request {
  user: {
    _id: Types.ObjectId;
    role: string;
    email: string;
  };
}

@Controller('v1/cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  create(
    @Param('productId') productId: Types.ObjectId,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.create(productId, user_id);
  }
  @Post('/coupon/:couponName')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  applyCoupon(
    @Param('couponName') couponName: string,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.applyCoupon(user_id, couponName);
  }

  @Get()
  @Roles(['user'])
  @UseGuards(AuthGuard)
  findOneForUser(@Req() req: AuthRequest) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.findOne(user_id);
  }

  @Patch(':productId')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  update(
    @Param('productId') productId: Types.ObjectId,
    @Body(new ValidationPipe({ forbidNonWhitelisted: true, whitelist: true }))
    updateCartItemsDto: UpdateCartItemsDto,
    @Req() req: AuthRequest,
  ) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;
    return this.cartService.update(productId, user_id, updateCartItemsDto);
  }

  @Delete(':id')
  @Roles(['user'])
  @UseGuards(AuthGuard)
  remove(@Param('id') productId: Types.ObjectId, @Req() req: AuthRequest) {
    if (req.user.role.toLowerCase() === 'admin') {
      throw new UnauthorizedException();
    }
    const user_id = req.user._id;

    return this.cartService.remove(productId, user_id);
  }

  //  @docs   Can Admin Get Any Cart of user
  //  @Route  GET /api/v1/cart/admin/:userId
  //  @access Private [Admin]
  @Get('/admin/:userId')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findOneForAdmin(@Param('userId') userId: string) {
    return this.cartService.findOneForAdmin(userId);
  }
  //  @docs   Can Admin Get All Carts
  //  @Route  GET /api/v1/cart/admin
  //  @access Private [Admin]
  @Get('/admin')
  @Roles(['admin'])
  @UseGuards(AuthGuard)
  findAllForAdmin() {
    return this.cartService.findAllForAdmin();
  }
}
