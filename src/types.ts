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
  guests: number;
  rating: number;
  images: string[];
  bedrooms: number;
  latitude: number;
  longitude: number;
  bathrooms: number;
  isFeatured: boolean;
  description: string;
  insuranceFee: number;
  cleaningFee: number;
  salesTaxPercent: number;
  availableDates: string[];
  serviceFeePercent: number;
  lodgingTaxPercent: number;
  offerings: { name: string; icon: string }[];
};

export type HostawayCalendar = {
  date: string;
  price: number;
  status: 'available';
}[];
