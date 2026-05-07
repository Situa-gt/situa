import { runPhase1 } from './phases/phase-1-geography'
import { runPhase2 } from './phases/phase-2-developers'
import { runPhase3 } from './phases/phase-3-projects'
import { runPhase4 } from './phases/phase-4-models'
import { runPhase5 } from './phases/phase-5-media'
import { runPhase6 } from './phases/phase-6-redirects'

async function main() {
  const start = Date.now()
  console.log('🚀 Bubble → Supabase migration starting')
  console.log(`   ${new Date().toISOString()}\n`)

  await runPhase1()
  await runPhase2()
  await runPhase3()
  await runPhase4()
  await runPhase5()
  await runPhase6()

  const elapsed = Math.round((Date.now() - start) / 1000)
  console.log(`\n✅ Migration complete in ${elapsed}s`)
  console.log('   Run "npm run migrate:verify" to check results.')
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})
