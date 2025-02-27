export interface Product {
  id: string | number;
  Name: string;
  THC: string | number;
  Aroma: string;
  Effects: string;
  image: string;
  is_new: boolean;
  price?: number;
  mediaUrls?: string[] | null;
  videoUrls?: string[] | null;
} 