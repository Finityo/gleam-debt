-- Create user_plan_data table for storing debt plans
CREATE TABLE public.user_plan_data (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  debts JSONB NOT NULL DEFAULT '[]'::jsonb,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  plan JSONB,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_plan_data ENABLE ROW LEVEL SECURITY;

-- Users can view their own plan data
CREATE POLICY "Users can view their own plan data"
ON public.user_plan_data
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own plan data
CREATE POLICY "Users can insert their own plan data"
ON public.user_plan_data
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own plan data
CREATE POLICY "Users can update their own plan data"
ON public.user_plan_data
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own plan data
CREATE POLICY "Users can delete their own plan data"
ON public.user_plan_data
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_plan_data_updated_at
BEFORE UPDATE ON public.user_plan_data
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_plan_data_user_id ON public.user_plan_data(user_id);
CREATE INDEX idx_user_plan_data_updated_at ON public.user_plan_data(updated_at);