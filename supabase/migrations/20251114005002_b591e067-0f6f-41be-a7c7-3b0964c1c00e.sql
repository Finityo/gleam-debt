-- Table: payoff_events (to track wins the streak engine can use)
CREATE TABLE IF NOT EXISTS public.payoff_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- e.g. 'extra_payment', 'debt_closed', 'on_time_month'
  event_date DATE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payoff_events_user_date_idx
  ON public.payoff_events (user_id, event_date DESC);

-- Enable RLS
ALTER TABLE public.payoff_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payoff_events
CREATE POLICY "Users can insert their own payoff events"
  ON public.payoff_events
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own payoff events"
  ON public.payoff_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own payoff events"
  ON public.payoff_events
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payoff events"
  ON public.payoff_events
  FOR DELETE
  USING (auth.uid() = user_id);

-- Table: user_risk_alerts (historical log of risk alerts)
CREATE TABLE IF NOT EXISTS public.user_risk_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL, -- e.g. 'high_utilization', 'no_extra', 'long_payoff'
  severity TEXT NOT NULL,   -- 'low', 'medium', 'high'
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS user_risk_alerts_user_created_idx
  ON public.user_risk_alerts (user_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_risk_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_risk_alerts
CREATE POLICY "Users can view their own risk alerts"
  ON public.user_risk_alerts
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert risk alerts"
  ON public.user_risk_alerts
  FOR INSERT
  WITH CHECK (true);

-- Table: coach_actions (Action Queue)
CREATE TABLE IF NOT EXISTS public.coach_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL,       -- e.g. 'increase_extra', 'target_debt', 'habit'
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'completed', 'ignored'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS coach_actions_user_status_idx
  ON public.coach_actions (user_id, status, created_at DESC);

-- Enable RLS
ALTER TABLE public.coach_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for coach_actions
CREATE POLICY "Users can insert their own coach actions"
  ON public.coach_actions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own coach actions"
  ON public.coach_actions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own coach actions"
  ON public.coach_actions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own coach actions"
  ON public.coach_actions
  FOR DELETE
  USING (auth.uid() = user_id);