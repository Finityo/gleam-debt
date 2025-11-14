-- Transactions table (for analysis)
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id UUID,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  merchant TEXT,
  category TEXT[],
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transactions_user_date_idx
  ON public.transactions (user_id, date DESC);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Insight settings (user-configurable thresholds, alerts)
CREATE TABLE IF NOT EXISTS public.insight_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  anomaly_threshold NUMERIC DEFAULT 500,
  ignored_categories TEXT[] DEFAULT '{}',
  daily_alerts BOOLEAN DEFAULT false,
  weekly_reports BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.insight_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own insight settings"
  ON public.insight_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insight settings"
  ON public.insight_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insight settings"
  ON public.insight_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Financial health score history (for trendline)
CREATE TABLE IF NOT EXISTS public.financial_health_history (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS financial_health_history_user_created_idx
  ON public.financial_health_history (user_id, created_at DESC);

ALTER TABLE public.financial_health_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own score history"
  ON public.financial_health_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own score history"
  ON public.financial_health_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);