-- Create table for storing Plaid items and access tokens
CREATE TABLE public.plaid_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  access_token TEXT NOT NULL,
  item_id TEXT NOT NULL,
  institution_id TEXT,
  institution_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plaid_items ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own plaid items" 
ON public.plaid_items 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plaid items" 
ON public.plaid_items 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid items" 
ON public.plaid_items 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid items" 
ON public.plaid_items 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create table for storing account information
CREATE TABLE public.plaid_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plaid_item_id UUID NOT NULL REFERENCES public.plaid_items(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  official_name TEXT,
  type TEXT NOT NULL,
  subtype TEXT,
  mask TEXT,
  current_balance DECIMAL(12, 2),
  available_balance DECIMAL(12, 2),
  currency_code TEXT DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.plaid_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own plaid accounts" 
ON public.plaid_accounts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own plaid accounts" 
ON public.plaid_accounts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own plaid accounts" 
ON public.plaid_accounts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own plaid accounts" 
ON public.plaid_accounts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_plaid_items_updated_at
BEFORE UPDATE ON public.plaid_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plaid_accounts_updated_at
BEFORE UPDATE ON public.plaid_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();