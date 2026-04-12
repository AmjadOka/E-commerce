/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
export class ApiFeatures {
  constructor(
    public query: any,
    private queryString: Record<string, any>,
  ) {}

  filter() {
    const queryObj = { ...this.queryString };
    const excludedFields = [
      'page',
      'limit',
      'sort',
      'keyword',
      'category',
      'fields',
    ];

    excludedFields.forEach((el) => delete queryObj[el]);

    // 🔥 CATEGORY RELATION HANDLING

    if (this.queryString.category) {
      queryObj.category = this.queryString.category;
    }
    //  Delete empty values
    const cleanObject = (obj: any) => {
      Object.keys(obj).forEach((key) => {
        if (obj[key] === '' || obj[key] === undefined) {
          delete obj[key];
        } else if (typeof obj[key] === 'object') {
          cleanObject(obj[key]);

          // Delete empty objects
          if (Object.keys(obj[key]).length === 0) {
            delete obj[key];
          }
        }
      });
    };
    cleanObject(queryObj);

    const parsedQuery: any = {};

    for (const key in queryObj) {
      const value = queryObj[key];

      const match = key.match(/(.+)\[(gte|gt|lte|lt|in)\]/);

      if (match) {
        const field = match[1]; // price
        const op = match[2]; // gte

        if (!parsedQuery[field]) parsedQuery[field] = {};

        parsedQuery[field][`$${op}`] = Number(value);
      } else {
        parsedQuery[key] = value;
      }
    }

    this.query = this.query.find(parsedQuery);
    return this;
  }
  search() {
    if (this.queryString.keyword) {
      this.query = this.query.find({
        $or: [
          {
            title: {
              $regex: this.queryString.keyword,
              $options: 'i',
            },
          },
          {
            description: {
              $regex: this.queryString.keyword,
              $options: 'i',
            },
          },
        ],
      });
    }

    return this;
  }

  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    }
    return this;
  }

  paginate() {
    const page = Number(this.queryString.page) || 1;
    const limit = Number(this.queryString.limit) || 5;

    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
