/**
 * One-time script: creates LVIS Pro + Enterprise products in Wave Apps
 * and prints the IDs to add as Vercel env vars.
 *
 * Usage:
 *   WAVE_FULL_ACCESS_TOKEN=your_token WAVE_BUSINESS_ID=your_business_id \
 *     node scripts/setup-wave-products.mjs
 */

const token = process.env.WAVE_FULL_ACCESS_TOKEN
const businessId = process.env.WAVE_BUSINESS_ID

if (!token)      { console.error('❌  Set WAVE_FULL_ACCESS_TOKEN'); process.exit(1) }
if (!businessId) { console.error('❌  Set WAVE_BUSINESS_ID');       process.exit(1) }

async function waveQuery(query, variables = {}) {
  const res = await fetch('https://gql.waveapps.com/graphql/public', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '))
  }
  return json.data
}

// Fetch all accounts and find the first income account (type INCOME)
async function getIncomeAccountId() {
  const data = await waveQuery(
    `query GetAccounts($businessId: ID!) {
      business(id: $businessId) {
        accounts(types: [INCOME]) {
          edges {
            node {
              id
              name
              type { name }
            }
          }
        }
      }
    }`,
    { businessId }
  )

  const accounts = data.business?.accounts?.edges ?? []
  if (accounts.length === 0) throw new Error('No income accounts found in your Wave chart of accounts.')

  // Prefer "Sales" or "Services" if present, otherwise take the first income account
  const preferred = accounts.find(({ node }) =>
    /sales|service|revenue/i.test(node.name)
  )
  const account = preferred ?? accounts[0]
  console.log(`  Using income account: "${account.node.name}" (${account.node.id})`)
  return account.node.id
}

async function createProduct(name, description, unitPrice, incomeAccountId) {
  const data = await waveQuery(
    `mutation CreateProduct($input: ProductCreateInput!) {
      productCreate(input: $input) {
        didSucceed
        inputErrors { message }
        product { id name }
      }
    }`,
    {
      input: {
        businessId,
        name,
        description,
        unitPrice: unitPrice.toFixed(2),
        incomeAccountId,
      },
    }
  )

  if (!data.productCreate.didSucceed) {
    throw new Error(data.productCreate.inputErrors.map((e) => e.message).join('; '))
  }

  return data.productCreate.product
}

console.log('\nFetching Wave chart of accounts...')
const incomeAccountId = await getIncomeAccountId()

console.log('\nCreating LVIS products in Wave...\n')

try {
  const [unit, pro, enterprise] = await Promise.all([
    createProduct(
      'LVIS™ — Single Analysis',
      'One forensic image analysis credit (pay-per-use)',
      9.99,
      incomeAccountId
    ),
    createProduct(
      'LVIS™ Pro — Monthly Subscription',
      '10 forensic image analyses per month',
      49.00,
      incomeAccountId
    ),
    createProduct(
      'LVIS™ Enterprise — Monthly Subscription',
      'Unlimited forensic image analyses per month',
      199.00,
      incomeAccountId
    ),
  ])

  console.log('✅  Products created successfully!\n')
  console.log('Add these to Vercel → Settings → Environment Variables:\n')
  console.log(`WAVE_PRODUCT_UNIT_ID=${unit.id}`)
  console.log(`WAVE_PRODUCT_PRO_ID=${pro.id}`)
  console.log(`WAVE_PRODUCT_ENTERPRISE_ID=${enterprise.id}`)
  console.log('\nThen redeploy your Vercel project.')
} catch (err) {
  console.error('❌  Error:', err.message)
  process.exit(1)
}
