-- Add full-text search capabilities to key tables

-- Add search columns and indexes for debts table
ALTER TABLE public.debts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(debt_type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(notes, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS debts_search_idx ON public.debts USING GIN (search_vector);

-- Add search columns and indexes for plaid_accounts table
ALTER TABLE public.plaid_accounts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(official_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(subtype, '')), 'C')
  ) STORED;

CREATE INDEX IF NOT EXISTS plaid_accounts_search_idx ON public.plaid_accounts USING GIN (search_vector);

-- Add search columns and indexes for plaid_items table
ALTER TABLE public.plaid_items ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(institution_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(institution_id, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS plaid_items_search_idx ON public.plaid_items USING GIN (search_vector);

-- Create a search function for users to search their own data
CREATE OR REPLACE FUNCTION public.search_all_tables(
  search_query text,
  search_type text DEFAULT 'all' -- 'debts', 'accounts', 'items', 'all'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb := '{"debts":[],"accounts":[],"items":[]}'::jsonb;
  ts_query tsquery;
BEGIN
  -- Convert search query to tsquery
  ts_query := plainto_tsquery('english', search_query);
  
  -- Search debts if requested
  IF search_type IN ('all', 'debts') THEN
    result := jsonb_set(
      result,
      '{debts}',
      (
        SELECT COALESCE(jsonb_agg(row_to_json(d)), '[]'::jsonb)
        FROM (
          SELECT id, name, debt_type, balance, min_payment, apr, due_date, notes, created_at,
                 ts_rank(search_vector, ts_query) as rank
          FROM public.debts
          WHERE search_vector @@ ts_query
            AND user_id = auth.uid()
          ORDER BY rank DESC
          LIMIT 20
        ) d
      )
    );
  END IF;
  
  -- Search accounts if requested
  IF search_type IN ('all', 'accounts') THEN
    result := jsonb_set(
      result,
      '{accounts}',
      (
        SELECT COALESCE(jsonb_agg(row_to_json(a)), '[]'::jsonb)
        FROM (
          SELECT id, name, official_name, subtype, current_balance, available_balance, created_at,
                 ts_rank(search_vector, ts_query) as rank
          FROM public.plaid_accounts
          WHERE search_vector @@ ts_query
            AND user_id = auth.uid()
          ORDER BY rank DESC
          LIMIT 20
        ) a
      )
    );
  END IF;
  
  -- Search items if requested
  IF search_type IN ('all', 'items') THEN
    result := jsonb_set(
      result,
      '{items}',
      (
        SELECT COALESCE(jsonb_agg(row_to_json(i)), '[]'::jsonb)
        FROM (
          SELECT id, institution_name, institution_id, created_at,
                 ts_rank(search_vector, ts_query) as rank
          FROM public.plaid_items
          WHERE search_vector @@ ts_query
            AND user_id = auth.uid()
          ORDER BY rank DESC
          LIMIT 20
        ) i
      )
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.search_all_tables(text, text) TO authenticated;