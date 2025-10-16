-- Create table to track Plaid item status and update requirements
CREATE TABLE public.plaid_item_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  item_id TEXT NOT NULL,
  needs_update BOOLEAN NOT NULL DEFAULT false,
  update_reason TEXT,
  last_webhook_code TEXT,
  last_webhook_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(item_id)
);

-- Enable RLS
ALTER TABLE public.plaid_item_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own item status"
ON public.plaid_item_status
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own item status"
ON public.plaid_item_status
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own item status"
ON public.plaid_item_status
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own item status"
ON public.plaid_item_status
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for timestamps
CREATE TRIGGER update_plaid_item_status_updated_at
BEFORE UPDATE ON public.plaid_item_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();