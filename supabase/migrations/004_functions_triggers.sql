-- =====================================================
-- DATABASE FUNCTIONS AND TRIGGERS
-- =====================================================
-- This migration creates utility functions and triggers
-- for automation and data consistency
-- =====================================================

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- USER PROFILE SYNC TRIGGER (Auth.users -> public.users)
-- =====================================================

-- Function to create user profile when auth user is created
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'USER'),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users to sync with public.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- ORDER TOTAL CALCULATION FUNCTION
-- =====================================================

-- Function to calculate order total from order items
CREATE OR REPLACE FUNCTION calculate_order_total(p_order_id uuid)
RETURNS numeric AS $$
DECLARE
  v_total numeric;
BEGIN
  SELECT COALESCE(SUM(price * quantity), 0)
  INTO v_total
  FROM order_items
  WHERE order_id = p_order_id;
  
  RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update order total when items change
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE orders
    SET total_amount = calculate_order_total(OLD.order_id),
        updated_at = NOW()
    WHERE id = OLD.order_id;
    RETURN OLD;
  ELSE
    UPDATE orders
    SET total_amount = calculate_order_total(NEW.order_id),
        updated_at = NOW()
    WHERE id = NEW.order_id;
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_item_total_update
  AFTER INSERT OR UPDATE OR DELETE ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION update_order_total();

-- =====================================================
-- PAYMENT SCHEDULE GENERATION FUNCTION
-- =====================================================

-- Function to generate payment schedule for custom orders
CREATE OR REPLACE FUNCTION generate_payment_schedule(
  p_total_amount numeric,
  p_down_payment numeric,
  p_advance_money numeric,
  p_payment_months integer,
  p_start_date timestamptz
)
RETURNS jsonb AS $$
DECLARE
  v_remaining_amount numeric;
  v_monthly_payment numeric;
  v_schedule jsonb := '[]'::jsonb;
  v_installment jsonb;
  v_month integer;
  v_due_date timestamptz;
BEGIN
  -- Calculate remaining amount after down payment and advance
  v_remaining_amount := p_total_amount - p_down_payment - p_advance_money;
  
  -- Calculate monthly payment (evenly distributed)
  v_monthly_payment := v_remaining_amount / p_payment_months;
  
  -- Generate installments
  FOR v_month IN 1..p_payment_months LOOP
    v_due_date := p_start_date + (v_month || ' months')::interval;
    
    v_installment := jsonb_build_object(
      'id', gen_random_uuid(),
      'dueDate', v_due_date,
      'amount', ROUND(v_monthly_payment, 2),
      'status', 'pending',
      'paidDate', null,
      'paidAmount', 0,
      'method', null,
      'notes', null
    );
    
    v_schedule := v_schedule || v_installment;
  END LOOP;
  
  RETURN v_schedule;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INVOICE AMOUNT CALCULATION FUNCTION
-- =====================================================

-- Function to calculate invoice amounts with discount
CREATE OR REPLACE FUNCTION calculate_invoice_amounts(
  p_subtotal numeric,
  p_discount_type discount_type,
  p_discount_value numeric
)
RETURNS TABLE(total numeric, discount_amount numeric) AS $$
DECLARE
  v_discount_amount numeric := 0;
  v_total numeric;
BEGIN
  IF p_discount_type = 'PERCENTAGE' THEN
    v_discount_amount := p_subtotal * (p_discount_value / 100);
  ELSIF p_discount_type = 'AMOUNT' THEN
    v_discount_amount := p_discount_value;
  END IF;
  
  v_total := p_subtotal - v_discount_amount;
  
  RETURN QUERY SELECT v_total, v_discount_amount;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- INVOICE STATUS UPDATE TRIGGER
-- =====================================================

-- Function to update invoice status based on payments
CREATE OR REPLACE FUNCTION update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_total_paid numeric;
  v_new_status invoice_status;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = NEW.invoice_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id;
  
  -- Determine status
  IF v_total_paid >= v_invoice.total THEN
    v_new_status := 'PAID';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'PARTIAL';
  ELSE
    v_new_status := 'UNPAID';
  END IF;
  
  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = v_total_paid,
    amount_due = total - v_total_paid,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_updates_invoice
  AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status();

-- Also handle payment deletion
CREATE OR REPLACE FUNCTION update_invoice_status_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice invoices%ROWTYPE;
  v_total_paid numeric;
  v_new_status invoice_status;
BEGIN
  -- Get invoice details
  SELECT * INTO v_invoice
  FROM invoices
  WHERE id = OLD.invoice_id;
  
  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payments
  WHERE invoice_id = OLD.invoice_id;
  
  -- Determine status
  IF v_total_paid >= v_invoice.total THEN
    v_new_status := 'PAID';
  ELSIF v_total_paid > 0 THEN
    v_new_status := 'PARTIAL';
  ELSE
    v_new_status := 'UNPAID';
  END IF;
  
  -- Update invoice
  UPDATE invoices
  SET 
    amount_paid = v_total_paid,
    amount_due = total - v_total_paid,
    status = v_new_status,
    updated_at = NOW()
  WHERE id = OLD.invoice_id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_delete_updates_invoice
  AFTER DELETE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_status_on_delete();

-- =====================================================
-- PRODUCT STOCK MANAGEMENT FUNCTION
-- =====================================================

-- Function to update product stock after order
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
DECLARE
  v_order_status order_status;
BEGIN
  -- Get order status
  SELECT status INTO v_order_status
  FROM orders
  WHERE id = NEW.order_id;
  
  -- Only reduce stock when order is confirmed (not PENDING or CANCELLED)
  IF v_order_status IN ('IN_PROGRESS', 'DELIVERED') THEN
    UPDATE products
    SET 
      stock = stock - NEW.quantity,
      availability = CASE WHEN (stock - NEW.quantity) <= 0 THEN false ELSE availability END,
      updated_at = NOW()
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Note: This is commented out as stock management might need more complex logic
-- Uncomment if you want automatic stock deduction
-- CREATE TRIGGER order_item_reduces_stock
--   AFTER INSERT ON order_items
--   FOR EACH ROW
--   EXECUTE FUNCTION update_product_stock();

-- =====================================================
-- SEARCH FUNCTIONS
-- =====================================================

-- Function for full-text search on products
CREATE OR REPLACE FUNCTION search_products(search_term text)
RETURNS SETOF products AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM products
  WHERE 
    name ILIKE '%' || search_term || '%' OR
    description ILIKE '%' || search_term || '%' OR
    category::text ILIKE '%' || search_term || '%'
  ORDER BY
    CASE
      WHEN name ILIKE search_term || '%' THEN 1
      WHEN name ILIKE '%' || search_term || '%' THEN 2
      ELSE 3
    END,
    created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Function for searching orders by multiple criteria
CREATE OR REPLACE FUNCTION search_orders(search_term text, user_uuid uuid DEFAULT NULL)
RETURNS SETOF orders AS $$
BEGIN
  RETURN QUERY
  SELECT o.*
  FROM orders o
  LEFT JOIN users u ON o.user_id = u.id
  WHERE 
    (user_uuid IS NULL OR o.user_id = user_uuid) AND
    (
      o.id::text ILIKE '%' || search_term || '%' OR
      u.name ILIKE '%' || search_term || '%' OR
      u.email ILIKE '%' || search_term || '%'
    )
  ORDER BY o.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ANALYTICS / REPORTING FUNCTIONS
-- =====================================================

-- Function to get sales statistics
CREATE OR REPLACE FUNCTION get_sales_stats(
  p_start_date timestamptz DEFAULT NULL,
  p_end_date timestamptz DEFAULT NULL
)
RETURNS TABLE(
  total_orders bigint,
  total_revenue numeric,
  average_order_value numeric,
  pending_orders bigint,
  completed_orders bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total_orders,
    COALESCE(SUM(total_amount), 0) as total_revenue,
    COALESCE(AVG(total_amount), 0) as average_order_value,
    COUNT(*) FILTER (WHERE status = 'PENDING')::bigint as pending_orders,
    COUNT(*) FILTER (WHERE status = 'DELIVERED')::bigint as completed_orders
  FROM orders
  WHERE
    (p_start_date IS NULL OR created_at >= p_start_date) AND
    (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql;

-- Function to get top selling products
CREATE OR REPLACE FUNCTION get_top_products(p_limit integer DEFAULT 10)
RETURNS TABLE(
  product_id uuid,
  product_name text,
  total_quantity bigint,
  total_revenue numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    oi.product_id,
    oi.product_name,
    SUM(oi.quantity)::bigint as total_quantity,
    SUM(oi.price * oi.quantity) as total_revenue
  FROM order_items oi
  JOIN orders o ON oi.order_id = o.id
  WHERE o.status != 'CANCELLED'
  GROUP BY oi.product_id, oi.product_name
  ORDER BY total_revenue DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- UTILITY FUNCTIONS
-- =====================================================

-- Function to generate unique invoice reference
CREATE OR REPLACE FUNCTION generate_invoice_reference()
RETURNS text AS $$
DECLARE
  v_year text;
  v_month text;
  v_count integer;
  v_reference text;
BEGIN
  v_year := to_char(NOW(), 'YYYY');
  v_month := to_char(NOW(), 'MM');
  
  SELECT COUNT(*) + 1 INTO v_count
  FROM invoices
  WHERE reference LIKE 'INV-' || v_year || v_month || '%';
  
  v_reference := 'INV-' || v_year || v_month || '-' || LPAD(v_count::text, 4, '0');
  
  RETURN v_reference;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DATA VALIDATION FUNCTIONS
-- =====================================================

-- Function to validate email format
CREATE OR REPLACE FUNCTION is_valid_email(p_email text)
RETURNS boolean AS $$
BEGIN
  RETURN p_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp';
COMMENT ON FUNCTION handle_new_user() IS 'Creates user profile in public.users when auth user is created';
COMMENT ON FUNCTION calculate_order_total(uuid) IS 'Calculates total amount for an order based on items';
COMMENT ON FUNCTION generate_payment_schedule(numeric, numeric, numeric, integer, timestamptz) IS 'Generates payment schedule for custom orders';
COMMENT ON FUNCTION calculate_invoice_amounts(numeric, discount_type, numeric) IS 'Calculates invoice total and discount amount';
COMMENT ON FUNCTION search_products(text) IS 'Full-text search for products';
COMMENT ON FUNCTION get_sales_stats(timestamptz, timestamptz) IS 'Returns sales statistics for a date range';
COMMENT ON FUNCTION get_top_products(integer) IS 'Returns top selling products';
COMMENT ON FUNCTION generate_invoice_reference() IS 'Generates unique invoice reference number';

