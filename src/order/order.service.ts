/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import Stripe from 'stripe';

import { Order } from './order.schema';
import { Cart } from 'src/cart/cart.schema';
import { Tax } from 'src/tax/tax.schema';
import { Product } from 'src/product/product.schema';
import { MailerService } from '@nestjs-modules/mailer';
import { CreateOrderDto, AcceptOrderCashDto } from './dto/create-order.dto';

const stripe = new Stripe(
  'sk_test_51TM37yEIZGVu0bnpCWjFHHJMi9SY50BSCGx2USdSCjIWlVCRTu04ReANX7hd6IlYaSMgHTVeLYHaM32XLpl7kLZQ00oQKWEl4x',
  {
    apiVersion: '2026-03-25.dahlia',
  },
);
@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(Cart.name) private cartModel: Model<Cart>,
    @InjectModel(Tax.name) private taxModel: Model<Tax>,
    @InjectModel(Product.name) private productModel: Model<Product>,
    private mailService: MailerService,
  ) {}

  // ================= CREATE ORDER =================
  async create(
    userId: string,
    paymentMethodType: 'cash' | 'card',
    dto: CreateOrderDto,
    urls: { success_url: string; cancel_url: string },
  ) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate<{
        cartItems: {
          productId: Product;
          quantity: number;
          color?: string;
        }[];
        user: any;
      }>([
        {
          path: 'cartItems.productId',
        },
        {
          path: 'user',
          select: '-password -role -__v',
        },
      ])
      .select('-__v'); // only affects cart itself
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
      throw new NotFoundException('empty cart');
    }
    const shippingAddress = cart.user.address || dto.shippingAddress;

    if (!shippingAddress) {
      throw new BadRequestException('Shipping address is required');
    }

    const tax = await this.taxModel.findOne();

    const taxPrice = tax?.taxPrice ?? 0;
    const shippingPrice = tax?.shippingPrice ?? 0;

    const totalOrderPrice =
      cart.totalPriceAfterDiscount + taxPrice + shippingPrice;

    const orderItems = cart.cartItems.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      color: item.color || '',
    }));
    const baseOrder = {
      user: cart.user._id,
      cartItems: orderItems,
      taxPrice,
      shippingPrice,
      totalOrderPrice,
      paymentMethodType,
      shippingAddress,
    };
    // ================= CASH =================
    if (paymentMethodType === 'cash') {
      const order = await this.orderModel.create({
        ...baseOrder,
        isPaid: totalOrderPrice === 0,
        paidAt: totalOrderPrice === 0 ? new Date() : undefined,
      });

      if (order.isPaid) {
        await this.updateStock(order.cartItems);
      }
      await this.clearCart(userId);

      return {
        status: 200,
        message: 'Order created successfully',
        data: order,
      };
    }

    // ================= STRIPE =================
    const line_items = cart.cartItems.map((item) => {
      const product = item.productId;
      const price = product.discount
        ? product.price - (product.price * product.discount) / 100
        : product.price;
      return {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(price * 100),
          product_data: {
            name: product.title,
            description: product.description,
            images: [product.imageCover, ...product.images],
            metadata: { color: item.color || '' },
          },
        },
        quantity: item.quantity,
      };
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: 'payment',
      success_url: urls.success_url,
      cancel_url: urls.cancel_url,
      client_reference_id: userId,
      customer_email: cart.user.email,
      metadata: { address: shippingAddress },
    });

    const order = await this.orderModel.create({
      ...baseOrder,
      sessionId: session.id,
      isPaid: false,
    });
    return {
      status: 200,
      message: 'Order created successfully',
      data: {
        url: session.url,
        sessionId: session.id,
        expires_at: new Date(session.expires_at * 1000),
        order,
      },
    };
  }

  // ================= UPDATE CASH ORDER =================
  async updatePaidCash(orderId: string, dto: AcceptOrderCashDto) {
    const order = await this.orderModel.findById(orderId);

    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentMethodType !== 'cash') {
      throw new BadRequestException('Order is not cash');
    }

    if (order.isPaid) {
      throw new BadRequestException('Order already paid');
    }

    if (dto.isPaid) {
      dto.paidAt = new Date();

      await this.updateStock(order.cartItems);
      await this.sendConfirmationEmail(order.user.toString());
    }

    if (dto.isDeliverd) {
      dto.deliverdAt = new Date();
    }

    const updated = await this.orderModel.findByIdAndUpdate(orderId, dto, {
      new: true,
    });

    return {
      status: 200,
      message: 'Order updated successfully',
      data: updated,
    };
  }

  async updatePaidCard(payload: any, sig: any, endpointSecret: string) {
    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook Error: ${err.message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionId = event.data.object.id;

        const order = await this.orderModel.findOne({ sessionId });
        if (!order) return;
        order.isPaid = true;
        order.isDelivered = true;
        order.paidAt = new Date();
        order.deliveredAt = new Date();

        const cart = await this.cartModel
          .findOne({ user: order.user.toString() })
          .populate<{
            user: { name: string; email: string; role: string };
            cartItems: { productId: Product; quantity: number }[];
          }>([{ path: 'cartItems.productId' }, { path: 'user', select: 'name email -role -password -__v' }]);
        if (!cart) {
          throw new NotFoundException('not found cart');
        }

        cart.cartItems.forEach(async (item) => {
          await this.productModel.findByIdAndUpdate(
            item.productId,
            { $inc: { quantity: -item.quantity, sold: item.quantity } },
            { returnDocument: 'after' },
          );
        });

        // reset Cart
        await this.cartModel.findOneAndUpdate(
          { user: order.user.toString() },
          { cartItems: [], totalPrice: 0 },
        );

        await order.save();
        await cart.save();

        // send mail
        const htmlMessage = `
    <html>
      <body>
        <h1>Order Confirmation</h1>
        <p>Dear ${cart.user.name},</p>
        <p>Thank you for your purchase! Your order has been successfully placed and paid for with card.♥</p>
        <p>We appreciate your business and hope you enjoy your purchase!</p>
        <p>Best regards,</p>
        <p>The Ecommerce-Nest.JS Team</p>
      </body>
    </html>
    `;

        await this.mailService.sendMail({
          from: `Ecommerce-Nest.JS <${process.env.MAIL_USER}>`,
          // eslint-disable-next-line
          // @ts-ignore
          to: cart.user.email,
          subject: `Ecommerce-Nest.JS - Checkout Order`,
          html: htmlMessage,
        });

        break;
      }
      // ... handle other event types
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  }

  async findAllOrdersOnUser(user_id: string) {
    const orders = await this.orderModel.find({ user: user_id });
    return {
      status: 200,
      message: 'Orders found',
      length: orders.length,
      data: orders,
    };
  }

  async findAllOrders() {
    const orders = await this.orderModel.find({});
    return {
      status: 200,
      message: 'Orders found',
      length: orders.length,
      data: orders,
    };
  }
  // ================= HELPERS =================

  private async updateStock(
    items: { productId: Types.ObjectId; quantity: number }[],
  ) {
    for (const item of items) {
      await this.productModel.findByIdAndUpdate(item.productId, {
        $inc: {
          quantity: -item.quantity,
          sold: item.quantity,
        },
      });
    }
  }

  private async clearCart(userId: string) {
    await this.cartModel.findOneAndUpdate(
      { user: userId },
      {
        cartItems: [],
        totalPrice: 0,
        totalPriceAfterDiscount: 0,
      },
    );
  }

  private async sendConfirmationEmail(userId: string) {
    const cart = await this.cartModel
      .findOne({ user: userId })
      .populate('user');

    if (!cart || !cart.user) return;

    const user = cart.user as any;

    await this.mailService.sendMail({
      to: user.email,
      subject: 'Order Confirmed',
      html: `
        <h1>Order Confirmation</h1>
        <p>Dear ${user.name},</p>
        <p>Your order has been successfully placed.</p>
      `,
    });
  }
}
