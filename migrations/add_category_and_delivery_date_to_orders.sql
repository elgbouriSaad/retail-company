-- Migration: Add category_id and actual_delivery_date to custom_orders table
-- Date: 2024-11-29
-- Description: Adds category tracking and actual delivery date to custom orders
--              The actual_delivery_date is automatically set when order status changes to 'delivered'

-- Add category_id column with foreign key to categories table
ALTER TABLE public.custom_orders
ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL;

-- Add actual_delivery_date column (automatically set when clicking "Livrer" button)
ALTER TABLE public.custom_orders
ADD COLUMN IF NOT EXISTS actual_delivery_date timestamp with time zone;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_custom_orders_category_id ON public.custom_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_custom_orders_actual_delivery_date ON public.custom_orders(actual_delivery_date);

-- Add comment to columns
COMMENT ON COLUMN public.custom_orders.category_id IS 'Foreign key reference to categories table';
COMMENT ON COLUMN public.custom_orders.actual_delivery_date IS 'The actual delivery date when order status changed to delivered (automatically set by system)';

