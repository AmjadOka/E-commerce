/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Product } from './product.schema';
import { isValidObjectId, Model } from 'mongoose';
import { Category } from 'src/category/category.schema';
import { SubCategory } from 'src/sub-category/sub-category.schema';
import { ApiFeatures } from './utils/api-features';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Category.name)
    private readonly categoryModule: Model<Category>,
    @InjectModel(SubCategory.name)
    private readonly subCategoryModule: Model<SubCategory>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.productModel.findOne({
      title: createProductDto.title,
    });
    const category = await this.categoryModule.findById(
      createProductDto.category,
    );

    if (product) {
      throw new HttpException('This Product already Exist', 400);
    }

    if (!category) {
      throw new HttpException('This Category not Exist', 400);
    }

    if (createProductDto.subCategory) {
      const subCategory = await this.subCategoryModule.findById(
        createProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException('This Sub Category not Exist', 400);
      }
    }
    const priceAfterDiscount = createProductDto?.priceAfterDiscount || 0;
    if (createProductDto.price < priceAfterDiscount) {
      throw new HttpException(
        'Must be price After discount greater than price',
        400,
      );
    }

    const newProduct = await (
      await this.productModel.create(createProductDto)
    ).populate('category subCategory brand', '-__v');
    return {
      status: 200,
      message: 'Product created successfully',
      data: newProduct,
    };
  }

  async findAll(query) {
    console.log(query);
    //handle if category added to query
    if (query.category) {
      if (isValidObjectId(query.category)) {
        const category = await this.categoryModule.findOne({
          _id: query.category,
        });
        if (!category) {
          throw new NotFoundException('Category not found');
        }
      } else {
        const category = await this.categoryModule.findOne({
          name: { $regex: `^${query.category}$`, $options: 'i' },
        });
        if (category) {
          query.category = category._id;
        }
        if (!category) {
          throw new NotFoundException('Category not found');
        }
      }
    }
    const features = new ApiFeatures(this.productModel.find(), query)
      .filter()
      .search()
      .sort()
      .limitFields()
      .paginate();

    const products = await features.query.populate(
      'category subCategory brand',
      '-__v',
    );
    return {
      status: 200,
      results: products.length,
      data: products,
    };
  }
  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .select('-__v')
      .populate('category subCategory brand', '-__v');
    if (!product) {
      throw new NotFoundException('Procut Not Found');
    }

    return {
      status: 200,
      message: 'Found a Product',
      data: product,
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findById(id);
    console.log(id, 'id');
    if (!product) {
      throw new NotFoundException('Procut Not Found');
    }
    if (updateProductDto.category) {
      const category = await this.categoryModule.findById(
        updateProductDto.category,
      );
      if (!category) {
        throw new HttpException('This Category not Exist', 400);
      }
    }
    if (updateProductDto.subCategory) {
      const subCategory = await this.subCategoryModule.findById(
        updateProductDto.subCategory,
      );
      if (!subCategory) {
        throw new HttpException('This Sub Category not Exist', 400);
      }
    }

    if (
      updateProductDto.sold !== undefined &&
      product.quantity < updateProductDto.sold
    ) {
      throw new HttpException('Thie Quantity is < sold', 400);
    }

    const price = updateProductDto?.price || product.price;
    const priceAfterDiscount =
      updateProductDto?.priceAfterDiscount || product.priceAfterDiscount;
    if (price < priceAfterDiscount) {
      throw new HttpException(
        'Must be price After discount greater than price',
        400,
      );
    }

    return {
      status: 200,
      message: 'Product Updated successfully',
      data: await this.productModel
        .findByIdAndUpdate(id, updateProductDto, {
          new: true,
        })
        .select('-__v')
        .populate('category subCategory brand', '-__v'),
    };
  }

  async remove(id: string): Promise<void> {
    const product = await this.productModel.findById(id);
    if (!product) {
      throw new NotFoundException('Procut Not Found');
    }

    await this.productModel.findByIdAndDelete(id);
  }
}
