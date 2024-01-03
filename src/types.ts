declare global {
  namespace Express {
    export interface Request {
      user?: UserSchema;
    }
  }
}

export type UserSchema = {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  password: string;
  status: string;
};

export type BlogSchema = {
  title: string;
  slug: string;
  content: string;
  image: string;
};

export type PropertySchema = {
  name: string;
  price: number;
  beds: number;
  baths: number;
  guests: number;
  rating: number;
  isFeatured: boolean;
  description: string;
  image: string;
};
