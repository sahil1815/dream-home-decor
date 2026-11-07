export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type StockStatus = 'in_stock' | 'made_to_order' | 'out_of_stock';

export type OrderStatus =
  | 'pending'
  | 'confirmation_call'
  | 'confirmed'
  | 'in_production'
  | 'ready'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type DeliveryZone = 'inside' | 'outside';
export type PaymentMethod = 'cod' | 'bkash' | 'nagad' | 'bkash_manual' | 'nagad_manual';

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
  show_placeholder_tag?: boolean;
  order_prefix?: string;
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

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  storage_key?: string | null;
  alt?: string | null;
  sort_order: number;
  width?: number | null;
  height?: number | null;
  blur_data_url?: string | null;
  source: 'placeholder' | 'drive' | 'upload';
  is_placeholder: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  variant_type: 'color' | 'size';
  name: string;
  sku?: string | null;
  price_adjustment: number;
  stock_quantity: number;
  image_url?: string | null;
  is_available: boolean;
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
  cost_price?: number | null;
  category_id: string | null;
  images: string[];
  dimensions: string | null;
  material: string | null;
  color_options: string[];
  stock_status: StockStatus;
  is_featured: boolean;
  is_active: boolean;
  has_placeholder_images?: boolean;
  lead_time_days?: number | null;
  specifications?: Record<string, string> | null;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string;
  updated_at?: string;
  // Joined relations:
  category?: Category;
  product_images?: ProductImage[];
  variants?: ProductVariant[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_title: string;
  selected_color?: string | null;
  selected_size?: string | null;
  quantity: number;
  unit_price: number;
  created_at?: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  note?: string | null;
  changed_by?: string | null;
  created_at: string;
}

export interface OrderNote {
  id: string;
  order_id: string;
  staff_id: string;
  staff_name: string;
  note: string;
  created_at: string;
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
  advance_payment_amount?: number;
  due_amount?: number;
  payment_method: PaymentMethod;
  transaction_id?: string | null;
  payment_verified?: boolean;
  cancel_reason?: string | null;
  is_flagged_suspicious?: boolean;
  order_notes?: string | null;
  status: OrderStatus;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  created_at: string;
  updated_at?: string;
  order_items?: OrderItem[];
  status_history?: OrderStatusHistory[];
  notes_history?: OrderNote[];
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  address?: string | null;
  delivery_zone?: DeliveryZone | null;
  total_orders: number;
  total_spent: number;
  is_blocked: boolean;
  notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DeliveryZoneConfig {
  id: string;
  name: string;
  name_bn: string;
  slug: DeliveryZone;
  charge: number;
  estimated_days: string;
  free_threshold?: number | null;
  is_active: boolean;
}

export type SiteMediaSlot =
  | 'hero'
  | 'workshop_1'
  | 'workshop_2'
  | 'workshop_3'
  | 'workshop_4'
  | 'about_team'
  | 'about_workshop'
  | 'showroom'
  | 'og_default';

export interface SiteMedia {
  id: string;
  slot: SiteMediaSlot | string;
  url: string;
  alt?: string | null;
  source: 'placeholder' | 'drive' | 'upload';
  is_placeholder: boolean;
  created_at: string;
  updated_at?: string;
}

export interface AuditLogEntry {
  id: string;
  admin_email: string;
  admin_role: string;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  details?: Record<string, unknown> | null;
  created_at: string;
}

export interface CustomFurnitureRequest {
  id: string;
  customer_name: string;
  customer_phone: string;
  dimensions?: string | null;
  color?: string | null;
  budget?: number | null;
  description?: string | null;
  reference_images?: string[];
  status: 'new' | 'quoted' | 'accepted' | 'rejected';
  quoted_price?: number | null;
  staff_notes?: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  customer_photos?: string[];
  is_approved: boolean;
  created_at: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'percent' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  usage_limit?: number | null;
  usage_count: number;
  expires_at?: string | null;
  is_active: boolean;
}

export interface AbandonedCheckout {
  id: string;
  customer_name?: string | null;
  customer_phone: string;
  cart_items: Json;
  subtotal: number;
  is_recovered: boolean;
  created_at: string;
  updated_at: string;
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
  selectedSize?: string;
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
