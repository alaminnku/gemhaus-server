declare global {
  namespace Express {
    export interface Request {
      user?: UserSchema;
    }
  }
}

export type UserSchema = {
  name: {
    first: string;
    last: string;
  };
  email: string;
  role: string;
  password: string;
  status: string;
};

export type ArticleSchema = {
  title: string;
  content: string;
  image: string;
};

export type PropertySchema = {
  hostawayId: number;
  name: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  rating: number;
  serviceFee: number;
  salesTax: number;
  lodgingTax: number;
  insuranceFee: number;
  cleaningFee: number;
  isFeatured: boolean;
  description: string;
  images: string[];
};
