/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart } from './cart.schema';
import { Product } from 'src/product/product.schema';
import { Coupon } from 'src/coupon/coupon.schema';
import { UpdateCartItemsDto } from './dto/update-cart-items.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private readonly cartModel: Model<Cart>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Coupon.name) private readonly couponModel: Model<Coupon>,
  ) {}

  private calculateTotals(cart: any) {
    let total = 0;
    let totalAfterDiscount = 0;

    for (const item of cart.cartItems as any[]) {
      const product = item.productId;

      const price = Number(product.price || 0);
      const discount = Number(product.discount || 0);

      const finalPrice = price * (1 - discount / 100);

      total += item.quantity * price;
      totalAfterDiscount += item.quantity * finalPrice;
    }

    return { total, totalAfterDiscount };
  }

  async create(productId: Types.ObjectId, userId: Types.ObjectId) {
    const product = await this.productModel.findById(productId);

    if (!product) throw new NotFoundException('Product not found');

    if (product.quantity <= 0) {
      throw new NotFoundException('Out of stock');
    }

    let cart = await this.cartModel.findOne({ user: userId });

    if (!cart) {
      cart = await this.cartModel.create({
        user: userId,
        cartItems: [],
      });
    }

    const index = cart.cartItems.findIndex(
      (item) => item.productId.toString() === productId.toString(),
    );

    const currentQty = index !== -1 ? cart.cartItems[index].quantity : 0;

    if (currentQty + 1 > product.quantity) {
      throw new NotFoundException('Not enough stock');
    }

    if (index !== -1) {
      cart.cartItems[index].quantity += 1;
    } else {
      cart.cartItems.push({
        productId,
        quantity: 1,
        color: '',
      } as any);
    }

    await cart.populate('cartItems.productId', 'price discount');

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Cart updated successfully',
      data: cart,
    };
  }

  async findOne(user_id: Types.ObjectId) {
    const cart = await this.cartModel
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price title description')
      .select('-__v');
    if (!cart) {
      throw new NotFoundException(
        `You don't hava a cart please go to add prducts`,
      );
    }

    return {
      status: 200,
      message: 'Found Cart',
      data: cart,
    };
  }
  findAll() {
    return 1;
  }
  async update(
    productId: Types.ObjectId,
    user_id: Types.ObjectId,
    updateCartItemsDto: UpdateCartItemsDto,
  ) {
    const cart = await this.cartModel
      .findOne({ user: user_id })
      .populate('cartItems.productId', 'price discount quantity');

    if (!cart) {
      return this.create(productId, user_id);
    }

    const product = await this.productModel.findById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const index = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (index === -1) {
      throw new NotFoundException('Product not in cart');
    }

    const cartItem = cart.cartItems[index];

    if (updateCartItemsDto.color !== undefined) {
      cartItem.color = updateCartItemsDto.color;
    }

    if (updateCartItemsDto.quantity !== undefined) {
      const newQty = updateCartItemsDto.quantity;

      if (newQty <= 0) {
        cart.cartItems.splice(index, 1);
      } else {
        if (newQty > product.quantity) {
          throw new NotFoundException('Not enough stock');
        }

        cartItem.quantity = newQty;
      }
    }

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Product Updated',
      data: cart,
    };
  }
  async remove(productId: Types.ObjectId, userId: Types.ObjectId) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('cartItems.productId', 'price discount');

    if (!cart) throw new NotFoundException('Cart not found');

    const index = cart.cartItems.findIndex(
      (item) => item.productId._id.toString() === productId.toString(),
    );

    if (index === -1) {
      throw new NotFoundException('Product not found in cart');
    }

    if (cart.cartItems[index].quantity > 1) {
      cart.cartItems[index].quantity -= 1;
    } else {
      cart.cartItems.splice(index, 1);
    }

    const { total, totalAfterDiscount } = this.calculateTotals(cart);

    cart.totalPrice = total;
    cart.totalPriceAfterDiscount = totalAfterDiscount;

    await cart.save();

    return {
      status: 200,
      message: 'Cart updated successfully',
      data: cart,
    };
  }
}
