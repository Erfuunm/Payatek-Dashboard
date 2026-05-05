
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'member');
CREATE TYPE public.department_code AS ENUM ('financial', 'sales', 'support', 'rnd', 'production');
CREATE TYPE public.entry_kind AS ENUM ('deposit', 'payment');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  department public.department_code,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(_user_id UUID)
RETURNS public.department_code LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department FROM public.profiles WHERE id = _user_id;
$$;

-- Auto profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, department)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'department')::public.department_code
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Financial entries
CREATE TABLE public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  department public.department_code NOT NULL,
  kind public.entry_kind NOT NULL,
  category TEXT NOT NULL,
  amount NUMERIC(18,2) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_forecast BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;
CREATE INDEX idx_fe_dep ON public.financial_entries(department);
CREATE INDEX idx_fe_dates ON public.financial_entries(start_date, end_date);

-- RLS: profiles
CREATE POLICY "users view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- RLS: user_roles
CREATE POLICY "view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS: financial_entries
CREATE POLICY "members view own dept entries" ON public.financial_entries
  FOR SELECT USING (
    public.has_role(auth.uid(), 'admin')
    OR department = public.get_user_department(auth.uid())
  );
CREATE POLICY "members insert own dept entries" ON public.financial_entries
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND department = public.get_user_department(auth.uid())
  );
CREATE POLICY "members update own entries" ON public.financial_entries
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "members delete own entries" ON public.financial_entries
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
