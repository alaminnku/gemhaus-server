declare global {
  namespace Express {
    export interface Request {
      user?: UserSchema;
    }
  }
}

export type UserSchema = {
  name: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  address?: string;
  qrCodeLink?: string;
  password?: string;
  properties?: UserProperty[];
  transactions?: UserTransaction[];
  role: 'ADMIN' | 'USER' | 'AGENT';
};

export type UserProperty = {
  _id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  images: string[];
  isFeatured: boolean;
  description: string;
};

export type UserTransaction = {
  address: string;
  type: 'sold' | 'available';
};

export type ArticleSchema = {
  title: string;
  excerpt: string;
  image: string;
  content: string;
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
  minimumStay: number;
}[];
