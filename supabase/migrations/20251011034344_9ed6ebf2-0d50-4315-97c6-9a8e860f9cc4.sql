-- Add DELETE policy for debt_calculator_settings
CREATE POLICY "Users can delete their own settings"
  ON public.debt_calculator_settings FOR DELETE
  USING (auth.uid() = user_id);