export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StockStatus = 'in_stock' | 'made_to_order' | 'out_of_stock';
export type OrderStatus = 'pending' | 'confirmed' | 'in_production' | 'shipped' | 'delivered' | 'cancelled';
export type DeliveryZone = 'inside' | 'outside';
export type PaymentMethod = 'cod' | 'bkash_manual' | 'nagad_manual';

export interface SiteSettings {
  id: number;
  site_name: string;
  site_name_bn: string;
  logo_url: string;
  cover_banner_url: string;
  phone: string;
  whatsapp_number: string;
  facebook_url: string;
  address: string;
  delivery_charge_inside: number;
  delivery_charge_outside: number;
  announcement_text: string;
  bkash_merchant_number?: string;
  nagad_merchant_number?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  name_bn: string;
  slug: string;
  image_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface Product {
  id: string;
  title: string;
  title_bn: string;
  slug: string;
  description: string | null;
  price: number;
  discount_price: number | null;
  category_id: string | null;
  images: string[];
  dimensions: string | null;
  material: string | null;
  color_options: string[];
  stock_status: StockStatus;
  is_featured: boolean;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  // Joined relation:
  category?: Category;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  selected_color?: string | null;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  delivery_zone: DeliveryZone;
  delivery_charge: number;
  subtotal: number;
  total_amount: number;
  payment_method: PaymentMethod;
  transaction_id?: string | null;
  order_notes?: string | null;
  status: OrderStatus;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
}

export interface CampaignGiveaway {
  id: string;
  title: string;
  description: string | null;
  banner_url: string;
  end_date: string | null;
  is_active: boolean;
  facebook_post_link: string | null;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
}

export interface WorkshopStep {
  id: string;
  title: string;
  desc: string;
  image: string;
}

export interface WorkshopVideoCard {
  enabled: boolean;
  badge: string;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
}

export interface WorkshopData {
  badge: string;
  title: string;
  description: string;
  steps: WorkshopStep[];
  videoCard: WorkshopVideoCard;
  updated_at?: string;
}
