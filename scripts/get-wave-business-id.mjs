/**
 * Fetches your Wave business IDs so you can set the correct WAVE_BUSINESS_ID env var.
 * Usage: WAVE_FULL_ACCESS_TOKEN=your_token node scripts/get-wave-business-id.mjs
 */

const token = process.env.WAVE_FULL_ACCESS_TOKEN
if (!token) { console.error('❌  Set WAVE_FULL_ACCESS_TOKEN env var'); process.exit(1) }

const res = await fetch('https://gql.waveapps.com/graphql/public', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    query: `query {
      businesses {
        edges {
          node {
            id
            name
            currency { code }
          }
        }
      }
    }`,
  }),
})

const json = await res.json()

if (json.errors) {
  console.error('❌  Wave API error:', json.errors)
  process.exit(1)
}

const businesses = json.data?.businesses?.edges ?? []
if (businesses.length === 0) {
  console.log('No businesses found. Check that your WAVE_FULL_ACCESS_TOKEN has the right permissions.')
  process.exit(1)
}

console.log('\nYour Wave businesses:\n')
for (const { node } of businesses) {
  console.log(`  Name:        ${node.name}`)
  console.log(`  Currency:    ${node.currency?.code}`)
  console.log(`  Business ID: ${node.id}`)
  console.log()
}
console.log('→ Copy the Business ID above and update WAVE_BUSINESS_ID in Vercel.')
