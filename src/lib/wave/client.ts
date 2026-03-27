// Wave Apps GraphQL client
// Docs: https://developer.waveapps.com/hc/en-us/articles/360019968212-API-Reference
// Endpoint: https://gql.waveapps.com/graphql/public

const WAVE_API = 'https://gql.waveapps.com/graphql/public'

function getToken() {
  const token = process.env.WAVE_FULL_ACCESS_TOKEN
  if (!token) throw new Error('WAVE_FULL_ACCESS_TOKEN env var is not set')
  return token
}

export function getBusinessId() {
  const id = process.env.WAVE_BUSINESS_ID
  if (!id) throw new Error('WAVE_BUSINESS_ID env var is not set')
  return id
}

async function waveQuery<T = unknown>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(WAVE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '))
  }
  return json.data as T
}

// ── Customer ───────────────────────────────────────────────────────────────────

/** Create a Wave customer and return their Wave customer ID. */
export async function waveCreateCustomer(
  email: string,
  name: string
): Promise<string> {
  const data = await waveQuery<{
    customerCreate: { customer: { id: string }; didSucceed: boolean; inputErrors: { message: string }[] }
  }>(
    `mutation CreateCustomer($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        didSucceed
        inputErrors { message }
        customer { id }
      }
    }`,
    {
      input: {
        businessId: getBusinessId(),
        name,
        email,
        currency: 'USD',
      },
    }
  )
  if (!data.customerCreate.didSucceed) {
    throw new Error(data.customerCreate.inputErrors.map((e) => e.message).join('; '))
  }
  return data.customerCreate.customer.id
}

// ── Invoice ────────────────────────────────────────────────────────────────────

const PLAN_PRODUCTS: Record<string, { name: string; amount: number }> = {
  pro:        { name: 'LVIS™ Pro — Monthly Subscription', amount: 4900 },   // cents
  enterprise: { name: 'LVIS™ Enterprise — Monthly Subscription', amount: 19900 },
}

/**
 * Resolve the Wave product ID for a tier.
 * Prefers the env var (WAVE_PRODUCT_PRO_ID / WAVE_PRODUCT_ENTERPRISE_ID) for speed,
 * falls back to querying the Wave products list and matching by name.
 */
async function resolveProductId(tier: 'pro' | 'enterprise'): Promise<string> {
  const envKey = tier === 'pro' ? 'WAVE_PRODUCT_PRO_ID' : 'WAVE_PRODUCT_ENTERPRISE_ID'
  const envId = process.env[envKey]
  if (envId) return envId

  // Fallback: fetch all products from Wave and match by name fragment
  const nameFragment = tier === 'pro' ? 'Pro' : 'Enterprise'
  const data = await waveQuery<{
    business: { products: { edges: { node: { id: string; name: string } }[] } }
  }>(
    `query GetProducts($businessId: ID!) {
      business(id: $businessId) {
        products {
          edges {
            node { id name }
          }
        }
      }
    }`,
    { businessId: getBusinessId() }
  )
  const products = data.business?.products?.edges ?? []
  const match = products.find(({ node }) => node.name.includes(nameFragment))
  if (!match) {
    throw new Error(
      `No Wave product found for tier "${tier}". ` +
      `Run scripts/setup-wave-products.mjs to create it, ` +
      `then set ${envKey} in Vercel env vars.`
    )
  }
  return match.node.id
}

/**
 * Create a Wave invoice, approve it, and return the invoice ID plus view URL
 * (the Wave payment / view link the customer uses to pay).
 */
export async function waveCreateInvoice(
  waveCustomerId: string,
  tier: 'pro' | 'enterprise'
): Promise<{ invoiceId: string; viewUrl: string }> {
  const product = PLAN_PRODUCTS[tier]
  if (!product) throw new Error(`Unknown tier: ${tier}`)

  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD
  const productId = await resolveProductId(tier)

  // 1. Create invoice in DRAFT state
  const createData = await waveQuery<{
    invoiceCreate: {
      didSucceed: boolean
      inputErrors: { message: string }[]
      invoice: { id: string; viewUrl: string }
    }
  }>(
    `mutation CreateInvoice($input: InvoiceCreateInput!) {
      invoiceCreate(input: $input) {
        didSucceed
        inputErrors { message }
        invoice {
          id
          viewUrl
        }
      }
    }`,
    {
      input: {
        businessId: getBusinessId(),
        customerId: waveCustomerId,
        invoiceDate: today,
        dueDate: today,
        memo: `Thank you for subscribing to LVIS™ ${tier.charAt(0).toUpperCase() + tier.slice(1)}.`,
        items: [
          {
            productId,
            description: product.name,
            quantity: '1',
            unitPrice: (product.amount / 100).toFixed(2),
          },
        ],
      },
    }
  )

  if (!createData.invoiceCreate.didSucceed) {
    throw new Error(createData.invoiceCreate.inputErrors.map((e) => e.message).join('; '))
  }

  const invoiceId = createData.invoiceCreate.invoice.id
  const viewUrl = createData.invoiceCreate.invoice.viewUrl

  // 2. Approve invoice (moves it from DRAFT → APPROVED so it can be paid)
  await waveQuery(
    `mutation ApproveInvoice($invoiceId: ID!) {
      invoiceApprove(input: { invoiceId: $invoiceId }) {
        didSucceed
        inputErrors { message }
      }
    }`,
    { invoiceId }
  )

  return { invoiceId, viewUrl }
}
