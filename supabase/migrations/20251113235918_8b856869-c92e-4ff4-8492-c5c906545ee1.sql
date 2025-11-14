-- Create financial health scores table
CREATE TABLE public.financial_health_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 300 AND score <= 850),
  factors JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user milestones table
CREATE TABLE public.user_milestones (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  date_reached TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user spending insights table
CREATE TABLE public.user_spending_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  totals JSONB NOT NULL DEFAULT '{}',
  anomalies JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month)
);

-- Enable RLS
ALTER TABLE public.financial_health_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_spending_insights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for financial_health_scores
CREATE POLICY "Users can view their own health score"
  ON public.financial_health_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own health score"
  ON public.financial_health_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own health score"
  ON public.financial_health_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_milestones
CREATE POLICY "Users can view their own milestones"
  ON public.user_milestones FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own milestones"
  ON public.user_milestones FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_spending_insights
CREATE POLICY "Users can view their own spending insights"
  ON public.user_spending_insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own spending insights"
  ON public.user_spending_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own spending insights"
  ON public.user_spending_insights FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_financial_health_scores_user_id ON public.financial_health_scores(user_id);
CREATE INDEX idx_user_milestones_user_id ON public.user_milestones(user_id);
CREATE INDEX idx_user_milestones_type ON public.user_milestones(milestone_type);
CREATE INDEX idx_user_spending_insights_user_id ON public.user_spending_insights(user_id);
CREATE INDEX idx_user_spending_insights_month ON public.user_spending_insights(month);

-- Add trigger for updated_at
CREATE TRIGGER update_financial_health_scores_updated_at
  BEFORE UPDATE ON public.financial_health_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_spending_insights_updated_at
  BEFORE UPDATE ON public.user_spending_insights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();