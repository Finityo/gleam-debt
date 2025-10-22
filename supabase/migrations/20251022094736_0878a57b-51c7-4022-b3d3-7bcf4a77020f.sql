-- Clean up orphaned Plaid data from deleted users
-- This removes Plaid items and accounts for users who no longer exist in profiles

-- Step 1: Delete orphaned plaid_accounts (child records first)
DELETE FROM plaid_accounts
WHERE plaid_item_id IN (
  SELECT pi.id 
  FROM plaid_items pi
  LEFT JOIN profiles p ON p.user_id = pi.user_id
  WHERE p.user_id IS NULL
);

-- Step 2: Delete orphaned plaid_items
DELETE FROM plaid_items
WHERE user_id NOT IN (SELECT user_id FROM profiles);

-- Step 3: Delete orphaned plaid_item_status records
DELETE FROM plaid_item_status
WHERE user_id NOT IN (SELECT user_id FROM profiles);