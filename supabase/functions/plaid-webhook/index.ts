import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'https://deno.land/x/jose@v5.2.0/index.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, plaid-verification',
};

const PLAID_CLIENT_ID = Deno.env.get('PLAID_CLIENT_ID');
const PLAID_SECRET = Deno.env.get('PLAID_SECRET');
const PLAID_ENV = Deno.env.get('PLAID_ENV') || 'sandbox';

function getPlaidUrl(): string {
  switch (PLAID_ENV) {
    case 'production':
      return 'https://production.plaid.com';
    case 'development':
      return 'https://development.plaid.com';
    default:
      return 'https://sandbox.plaid.com';
  }
}

// Verify Plaid webhook using JWT signature
async function verifyPlaidWebhook(
  bodyString: string,
  headers: Headers
): Promise<boolean> {
  try {
    // Step 1: Extract JWT from Plaid-Verification header
    const jwt = headers.get('plaid-verification');
    if (!jwt) {
      console.error('Missing Plaid-Verification header');
      return false;
    }

    // Step 2: Decode JWT header without verification to get kid
    const decodedHeader = jose.decodeProtectedHeader(jwt);
    
    // Step 3: Verify algorithm is ES256
    if (decodedHeader.alg !== 'ES256') {
      console.error('Invalid JWT algorithm, expected ES256, got:', decodedHeader.alg);
      return false;
    }

    const kid = decodedHeader.kid;
    if (!kid) {
      console.error('Missing kid in JWT header');
      return false;
    }

    console.log('Fetching verification key for kid:', kid);

    // Step 4: Get the JWK from Plaid
    const verificationKeyResponse = await fetch(`${getPlaidUrl()}/webhook_verification_key/get`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        key_id: kid,
      }),
    });

    if (!verificationKeyResponse.ok) {
      console.error('Failed to get verification key:', await verificationKeyResponse.text());
      return false;
    }

    const verificationKeyData = await verificationKeyResponse.json();
    const jwk = verificationKeyData.key;

    console.log('Retrieved JWK, verifying JWT...');

    // Step 5: Verify the JWT using the JWK
    const publicKey = await jose.importJWK(jwk, 'ES256');
    const { payload } = await jose.jwtVerify(jwt, publicKey, {
      algorithms: ['ES256'],
    });

    console.log('JWT verified successfully');

    // Step 6: Check timestamp - webhook should not be more than 5 minutes old
    const currentTime = Math.floor(Date.now() / 1000);
    const issuedAt = payload.iat as number;
    const timeDiff = currentTime - issuedAt;

    if (timeDiff > 300) { // 5 minutes in seconds
      console.error('Webhook is too old:', timeDiff, 'seconds');
      return false;
    }

    // Step 7: Verify SHA-256 hash of the body
    const bodyHashBuffer = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(bodyString)
    );
    const bodyHash = Array.from(new Uint8Array(bodyHashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    const expectedHash = payload.request_body_sha256 as string;

    if (bodyHash !== expectedHash) {
      console.error('Body hash mismatch. Expected:', expectedHash, 'Got:', bodyHash);
      return false;
    }

    console.log('Webhook verification successful');
    return true;
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Read body as text first for signature verification
    const bodyText = await req.text();
    
    // Verify Plaid webhook signature using JWT
    const isValidSignature = await verifyPlaidWebhook(bodyText, req.headers);
    if (!isValidSignature) {
      console.error('Webhook rejected: Invalid signature');
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const payload = JSON.parse(bodyText);
    
    console.log('Received Plaid webhook:', {
      type: payload.webhook_type,
      code: payload.webhook_code,
      item_id: payload.item_id,
      timestamp: new Date().toISOString()
    });

    // Handle different webhook types
    switch (payload.webhook_type) {
      case 'ITEM':
        await handleItemWebhook(supabaseClient, payload);
        break;
      case 'TRANSACTIONS':
        await handleTransactionsWebhook(supabaseClient, payload);
        break;
      case 'AUTH':
        await handleAuthWebhook(supabaseClient, payload);
        break;
      case 'LIABILITIES':
        await handleLiabilitiesWebhook(supabaseClient, payload);
        break;
      case 'IDENTITY':
        await handleIdentityWebhook(supabaseClient, payload);
        break;
      default:
        console.log('Unhandled webhook type:', payload.webhook_type);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function handleItemWebhook(supabase: any, payload: any) {
  console.log('Processing ITEM webhook:', payload.webhook_code);
  
  // Get item info for user_id
  const { data: items } = await supabase
    .from('plaid_items')
    .select('user_id')
    .eq('item_id', payload.item_id)
    .single();

  if (!items) {
    console.error('Item not found:', payload.item_id);
    return;
  }

  const userId = items.user_id;
  
  switch (payload.webhook_code) {
    case 'NEW_ACCOUNTS_AVAILABLE':
      console.log('New accounts available for item:', payload.item_id);
      // Mark item as needing update for new account selection
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'new_accounts_available',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'PENDING_EXPIRATION':
      console.log('Item pending expiration:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'pending_expiration',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'PENDING_DISCONNECT':
      console.log('Item pending disconnect:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'pending_disconnect',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'USER_PERMISSION_REVOKED':
      console.log('User permission revoked:', payload.item_id);
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: true,
          update_reason: 'permission_revoked',
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    
    case 'LOGIN_REPAIRED':
      console.log('Login repaired for item:', payload.item_id);
      // Clear the update requirement
      await supabase
        .from('plaid_item_status')
        .upsert({
          user_id: userId,
          item_id: payload.item_id,
          needs_update: false,
          update_reason: null,
          last_webhook_code: payload.webhook_code,
          last_webhook_at: new Date().toISOString(),
        });
      break;
    case 'ERROR':
      console.error('Item error:', payload.error);
      // Check if it's ITEM_LOGIN_REQUIRED
      if (payload.error?.error_code === 'ITEM_LOGIN_REQUIRED') {
        console.log('Item login required:', payload.item_id);
        await supabase
          .from('plaid_item_status')
          .upsert({
            user_id: userId,
            item_id: payload.item_id,
            needs_update: true,
            update_reason: 'login_required',
            last_webhook_code: payload.webhook_code,
            last_webhook_at: new Date().toISOString(),
          });
      }
      break;
    
    case 'USER_ACCOUNT_REVOKED':
      console.log('User account revoked (Chase-only):', payload.item_id);
      // Delete account numbers and data for this account
      if (payload.account_id) {
        await supabase
          .from('plaid_accounts')
          .delete()
          .eq('account_id', payload.account_id);
        console.log('Deleted revoked account:', payload.account_id);
      }
      break;
    
    default:
      console.log('Unhandled ITEM webhook code:', payload.webhook_code);
  }
}

async function handleTransactionsWebhook(supabase: any, payload: any) {
  console.log('Processing TRANSACTIONS webhook:', payload.webhook_code);
  // Future: implement transaction updates
}

async function handleAuthWebhook(supabase: any, payload: any) {
  console.log('Processing AUTH webhook:', payload.webhook_code);
  // Handle auth-related webhooks
}

async function handleLiabilitiesWebhook(supabase: any, payload: any) {
  console.log('Processing LIABILITIES webhook:', payload.webhook_code);
  // Handle liabilities updates
}

async function handleIdentityWebhook(supabase: any, payload: any) {
  console.log('Processing IDENTITY webhook:', payload.webhook_code);
  // Handle identity verification updates
}
