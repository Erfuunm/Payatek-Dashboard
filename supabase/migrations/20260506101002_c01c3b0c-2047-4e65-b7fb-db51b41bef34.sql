
-- Create test accounts for each department
DO $$
DECLARE
  u_financial uuid := gen_random_uuid();
  u_sales uuid := gen_random_uuid();
  u_support uuid := gen_random_uuid();
  u_rnd uuid := gen_random_uuid();
  u_production uuid := gen_random_uuid();
BEGIN
  -- Financial
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, recovery_token, email_change_token_new, email_change)
  VALUES
    (u_financial, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'financial@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','کاربر مالی','department','financial'), now(), now(), '', '', '', ''),
    (u_sales, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sales@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','کاربر فروش','department','sales'), now(), now(), '', '', '', ''),
    (u_support, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'support@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','کاربر پشتیبانی','department','support'), now(), now(), '', '', '', ''),
    (u_rnd, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rnd@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','کاربر تحقیق و توسعه','department','rnd'), now(), now(), '', '', '', ''),
    (u_production, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'production@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name','کاربر تولید','department','production'), now(), now(), '', '', '', '');

  INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  VALUES
    (gen_random_uuid(), u_financial, jsonb_build_object('sub', u_financial::text, 'email', 'financial@test.com'), 'email', u_financial::text, now(), now(), now()),
    (gen_random_uuid(), u_sales, jsonb_build_object('sub', u_sales::text, 'email', 'sales@test.com'), 'email', u_sales::text, now(), now(), now()),
    (gen_random_uuid(), u_support, jsonb_build_object('sub', u_support::text, 'email', 'support@test.com'), 'email', u_support::text, now(), now(), now()),
    (gen_random_uuid(), u_rnd, jsonb_build_object('sub', u_rnd::text, 'email', 'rnd@test.com'), 'email', u_rnd::text, now(), now(), now()),
    (gen_random_uuid(), u_production, jsonb_build_object('sub', u_production::text, 'email', 'production@test.com'), 'email', u_production::text, now(), now(), now());

  -- Sales test entries
  INSERT INTO public.financial_entries (user_id, department, kind, category, amount, start_date, end_date, is_forecast, note) VALUES
    (u_sales, 'sales', 'deposit', 'دریافت اصلی', 85000000, '2026-04-01', '2026-04-30', false, 'فروش محصولات اصلی'),
    (u_sales, 'sales', 'deposit', 'متفرقه', 12000000, '2026-04-05', '2026-04-25', false, 'فروش متفرقه'),
    (u_sales, 'sales', 'payment', 'پرداخت اصلی', 30000000, '2026-04-10', '2026-04-20', false, 'هزینه بازاریابی'),
    (u_sales, 'sales', 'payment', 'متفرقه', 5000000, '2026-04-15', '2026-04-28', false, 'هزینه نمایشگاه'),
    (u_sales, 'sales', 'deposit', 'دریافت اصلی', 110000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی فروش اردیبهشت'),
    (u_sales, 'sales', 'payment', 'پرداخت اصلی', 40000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی هزینه بازاریابی');

  -- Support entries
  INSERT INTO public.financial_entries (user_id, department, kind, category, amount, start_date, end_date, is_forecast, note) VALUES
    (u_support, 'support', 'deposit', 'دریافت اصلی', 25000000, '2026-04-01', '2026-04-30', false, 'قرارداد پشتیبانی سالانه'),
    (u_support, 'support', 'deposit', 'متفرقه', 4000000, '2026-04-10', '2026-04-20', false, 'تعمیرات اضافی'),
    (u_support, 'support', 'payment', 'پرداخت اصلی', 18000000, '2026-04-05', '2026-04-25', false, 'حقوق تیم پشتیبانی'),
    (u_support, 'support', 'payment', 'متفرقه', 3000000, '2026-04-12', '2026-04-22', false, 'قطعات یدکی'),
    (u_support, 'support', 'deposit', 'دریافت اصلی', 30000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی قراردادها'),
    (u_support, 'support', 'payment', 'پرداخت اصلی', 20000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی حقوق');

  -- R&D entries
  INSERT INTO public.financial_entries (user_id, department, kind, category, amount, start_date, end_date, is_forecast, note) VALUES
    (u_rnd, 'rnd', 'deposit', 'دریافت اصلی', 50000000, '2026-04-01', '2026-04-30', false, 'بودجه پروژه نوآوری'),
    (u_rnd, 'rnd', 'payment', 'پرداخت اصلی', 35000000, '2026-04-05', '2026-04-25', false, 'حقوق محققان'),
    (u_rnd, 'rnd', 'payment', 'متفرقه', 8000000, '2026-04-10', '2026-04-20', false, 'خرید تجهیزات آزمایشگاه'),
    (u_rnd, 'rnd', 'deposit', 'دریافت اصلی', 70000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی بودجه'),
    (u_rnd, 'rnd', 'payment', 'پرداخت اصلی', 45000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی هزینه‌های تحقیق');

  -- Production entries
  INSERT INTO public.financial_entries (user_id, department, kind, category, amount, start_date, end_date, is_forecast, note) VALUES
    (u_production, 'production', 'deposit', 'دریافت اصلی', 95000000, '2026-04-01', '2026-04-30', false, 'فروش محصولات تولیدی'),
    (u_production, 'production', 'deposit', 'متفرقه', 10000000, '2026-04-10', '2026-04-20', false, 'فروش ضایعات'),
    (u_production, 'production', 'payment', 'پرداخت اصلی', 55000000, '2026-04-05', '2026-04-25', false, 'مواد اولیه'),
    (u_production, 'production', 'payment', 'متفرقه', 12000000, '2026-04-12', '2026-04-22', false, 'هزینه نگهداری ماشین‌آلات'),
    (u_production, 'production', 'deposit', 'دریافت اصلی', 120000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی فروش'),
    (u_production, 'production', 'payment', 'پرداخت اصلی', 65000000, '2026-05-01', '2026-05-31', true, 'پیش‌بینی مواد اولیه');

  -- Set financial user as the owner of the existing financial dept entries (optional)
  UPDATE public.financial_entries SET user_id = u_financial WHERE department = 'financial' AND user_id NOT IN (SELECT id FROM auth.users);
END $$;
