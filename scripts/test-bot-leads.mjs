// Offline only: no environment loading and all service/email/webhook calls mocked.
// Run: node --conditions=react-server --import tsx scripts/test-bot-leads.mjs
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import ts from 'typescript'
import Module, { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
// Next aliases this compile-time marker; the standalone offline runner does not.
const originalLoad = Module._load
Module._load = function (name, ...args) {
  if (name === 'server-only') return {}
  return originalLoad.call(this, name, ...args)
}
const { BotLeadSchema } = require('../src/lib/leads/bot-schema.ts')
const { botLeadEmail } = require('../src/lib/leads/bot-email.ts')
const { formLeadEmail } = require('../src/lib/leads/form-email.ts')
const { createLead } = require('../src/lib/leads/create-lead.ts')
const { botLeadHandler } = require('../src/lib/leads/bot-handler.ts')
Module._load = originalLoad

let checks = 0
const check = (condition) => { assert.ok(condition, 'Offline expectation failed (values suppressed)'); checks++ }
const address = (name) => name + String.fromCharCode(64) + 'example.invalid'
const id = randomUUID()
const project = { id, name: 'Proyecto de prueba', developer_id: randomUUID() }
const input = {
  project_id: id, full_name: 'Persona de prueba', phone: '+502 5555-5555', email: '', message: '<Resumen>',
  qualification: {
    property_type: null, purpose: null, budget_range: null, budget_min_usd: null, budget_max_usd: null,
    monthly_payment_range: null, monthly_payment_max_gtq: null, down_payment: null, down_payment_amount: null,
    bedrooms: null, parking: null, zones: [], purchase_timing: null, stage: null, living_situation: null,
    household: null, pets: null, answered_all: false, turns: 1, duration_seconds: null,
  }, lead_score: 15, lead_tier: 'regular', recommended_project_ids: [id], conversation_id: 'offline-session',
}
function mockService({ developer = null, contacts = [], active = true, count = 0, insertCode = null } = {}) {
  const state = { inserts: [], updates: [], filters: [] }
  const service = { from(table) {
    let operation = 'select'
    const chain = {
      select() { return chain }, eq(...args) { state.filters.push([table, ...args]); return chain },
      insert(payload) { operation = 'insert'; state.inserts.push(payload); return chain },
      update(payload) { operation = 'update'; state.updates.push(payload); return chain },
      maybeSingle() { return chain }, single() { return chain },
      then(resolve, reject) {
        const data = table === 'projects' ? (active ? project : null) : table === 'developers' ? developer
          : table === 'project_contacts' ? contacts : operation === 'insert' ? { id } : null
        return Promise.resolve({ data, error: insertCode && operation === 'insert' ? { code: insertCode, message: 'Insert blocked' } : null, count }).then(resolve, reject)
      },
    }
    return chain
  } }
  return { service, state }
}
async function createCase(options = {}) {
  const { service, state } = mockService(options)
  const mail = [], hooks = []
  const result = await createLead(input, { channel: 'bot', ip: '127.0.0.1', ua: 'offline', project }, {
    createServiceClient: () => service,
    getLeadBccEmails: async () => options.bcc ?? [],
    sendEmail: async (payload) => { mail.push(payload); if (options.failMail) throw new Error('Simulated mail failure') },
    notifyWebhook: async (payload) => { hooks.push(payload) },
  })
  return { result, state, mail, hooks }
}
const originalError = console.error
console.error = () => {} // Expected mocked failure paths; never print fixture data.
globalThis.fetch = async () => { throw new Error('Network forbidden in offline tests') }
try {
  check(BotLeadSchema.safeParse(input).success)
  for (const patch of [{ email: null }, { full_name: 'x' }, { phone: 'invalid' }, { lead_score: 101 }, { lead_score: 1.5 }, { lead_tier: 'invalid' }, { conversation_id: '' }, { conversation_id: 'x'.repeat(65) }, { message: 'x'.repeat(2001) }, { recommended_project_ids: ['invalid'] }]) {
    check(!BotLeadSchema.safeParse({ ...input, ...patch }).success)
  }
  // Phone required, email optional (07-10-2026).
  check(!BotLeadSchema.safeParse({ ...input, phone: '', email: 'lead@example.com' }).success)
  check(BotLeadSchema.safeParse({ ...input, email: '' }).success)
  check(!BotLeadSchema.safeParse({ ...input, phone: '', email: '' }).success)
  const template = botLeadEmail(input, id, project.name)
  check(!template.html.includes(id))
  check(!template.html.includes('Correo electrónico') && !template.html.includes('Mascota') && !template.html.includes('Presupuesto'))
  check(template.html.includes('&lt;Resumen&gt;') && template.html.includes('Score 15/100 · Lead Regular'))
  const withValues = botLeadEmail({ ...input, qualification: { ...input.qualification, pets: false, bedrooms: 0, purchase_timing: 'este_mes' } }, id, project.name)
  check(/Mascota<\/td>\s*<td[^>]*>No</.test(withValues.html) && /Dormitorios<\/td>\s*<td[^>]*>0</.test(withValues.html) && withValues.html.includes('Este mes'))
  const zoned = botLeadEmail({ ...input, qualification: { ...input.qualification, zones: ['zona-14'], budget_max_usd: 200000 } }, id, project.name)
  check(zoned.html.includes('Zona 14') && !zoned.html.includes('zona-14') && zoned.html.includes('Hasta US$200,000'))
  const cases = [
    { developer: { contact_email: address('dev'), notification_emails: [address('DEV')] }, contacts: [{ email: address('project') }], bcc: [address('situa')] },
    { developer: { contact_email: address('dev') }, bcc: [address('situa')] },
    { contacts: [{ email: address('project') }], bcc: [address('situa')] },
    { bcc: [address('situa')] }, {}, { bcc: [address('situa')], failMail: true },
  ]
  for (const [i, options] of cases.entries()) {
    const { result, state, mail, hooks } = await createCase(options)
    check(state.inserts.length === 1 && state.inserts[0].channel === 'bot' && state.inserts[0].email === '')
    check(state.inserts[0].qualification === input.qualification && state.inserts[0].ip_address === '127.0.0.1')
    check(hooks.length === 0)
    check(result.email === (i === 4 ? 'skipped' : i === 5 ? 'failed' : 'sent'))
    check(i === 4 ? mail.length === 0 && !!state.updates[0].email_error : mail[0].to.length > 0)
    if (i === 0) check(mail[0].to.length === 2 && mail[0].bcc.length === 1)
    if (i === 3) check(mail[0].to[0] === address('situa') && mail[0].bcc === undefined)
    if (i === 5) check(state.updates[0].email_sent_at === null && !!state.updates[0].email_error)
  }
  // Execute the original form renderer from the exact base commit; compare output byte for byte.
  const old = execFileSync('git', ['show', 'ff41791:src/app/actions/contact.ts'], { encoding: 'utf8' })
  const helpers = old.slice(old.indexOf('function escHtml'), old.indexOf('export async function submitContactLead'))
  const html = old.slice(old.indexOf('  const html = `'), old.indexOf('  const situaBccEmails'))
  const originalRenderer = vm.runInNewContext(ts.transpile(helpers + '\n(function(parsed, project, modelName) {\n' + html + '\nreturn html;})'))
  for (const form of [{ ...input, email: address('lead') }, { full_name: '<Persona>', email: address('lead'), phone: undefined, message: undefined }]) {
    for (const model of [null, 'Modelo <A>']) check(formLeadEmail(form, project.name, model).html === originalRenderer({ data: form }, project, model))
  }
  // Run old and extracted server actions with identical mocks, including side effects.
  async function runAction(source, form, options) {
    const { service, state } = mockService(options)
    const mail = [], hooks = []
    const deps = {
      createServiceClient: () => service,
      sendEmail: async (payload) => { mail.push(payload); if (options.failMail) throw new Error('Simulated mail failure') },
      getLeadBccEmails: async () => options.bcc ?? [],
      notifyWebhook: async (payload) => { hooks.push(payload) },
    }
    const exports = {}
    const modules = {
      'next/headers': { headers: async () => new Headers({ 'x-forwarded-for': '127.0.0.1', 'user-agent': 'offline' }) },
      '@/lib/supabase/server': { createServerClient: () => service },
      '@/lib/supabase/service': deps,
      '@/lib/email/send-email': deps,
      '@/lib/site-settings': deps,
      '@/lib/webhook': deps,
      '@/lib/email/recipients': require('../src/lib/email/recipients.ts'),
      '@/lib/phone': require('../src/lib/phone.ts'),
      '@/lib/leads/create-lead': { createLead: (data, options) => createLead(data, options, deps) },
      zod: require('zod'),
    }
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText,
      { exports, Error, require: (name) => { if (!(name in modules)) throw new Error('Unmocked module'); return modules[name] }, console, process: { env: {} } })
    const result = await exports.submitContactLead(form)
    const updates = state.updates.map((item) => ({ ...item, email_attempted_at: !!item.email_attempted_at, email_sent_at: !!item.email_sent_at }))
    return JSON.stringify({ result, inserts: state.inserts, updates, mail, hooks })
  }
  const current = readFileSync(new URL('../src/app/actions/contact.ts', import.meta.url), 'utf8')
  for (const options of [{ bcc: [address('situa')] }, {}, { bcc: [address('situa')], failMail: true }, { active: false }, { insertCode: 'XX000' }]) {
    for (const patch of [{}, { full_name: 'x' }, { hp_company: 'spam' }, { message: 'x'.repeat(501) }, { phone: 'bad' }]) {
      const form = { project_id: id, full_name: 'Persona de prueba', email: address('lead'), phone: '+502 55555555', ...patch }
      const before = JSON.parse(await runAction(old, form, options))
      const after = JSON.parse(await runAction(current, form, options))
      for (const key of Object.keys(before)) {
        try { assert.deepEqual(before[key], after[key]); checks++ } catch { throw new Error('Behavior mismatch in ' + key) }
      }
    }
  }
  for (const config of [
    { status: 503, secret: '' }, { status: 401, supplied: '' }, { status: 401, supplied: 'bad' },
    { status: 400, body: '{' }, { status: 400, body: JSON.stringify({}) },
    { status: 404, active: false }, { status: 429, count: 4 }, { status: 429, race: true },
    { status: 201, email: 'sent' }, { status: 201, email: 'failed' }, { status: 201, email: 'skipped' },
  ]) {
    const { service, state } = mockService(config)
    let calls = 0
    const handler = botLeadHandler({ secret: () => config.secret ?? 'offline-secret', createServiceClient: () => service,
      createLead: async () => { calls++; return config.race ? { error: 'limit', code: 'P0429' } : { lead_id: id, email: config.email } },
    })
    const response = await handler(new Request('http://localhost/api/bot/leads', { method: 'POST', headers: { 'x-bot-secret': config.supplied ?? 'offline-secret' }, body: config.body ?? JSON.stringify(input) }))
    check(response.status === config.status && response.headers.get('cache-control') === 'no-store')
    if (config.status === 404) check(state.filters.some(([, key, value]) => key === 'is_active' && value === true))
    if (config.status === 201) check((await response.json()).email === config.email && calls === 1)
    else if (!config.race) check(calls === 0)
  }
  console.log(`PASS: ${checks} offline checks; no network or real leads.`)
} catch (error) {
  console.log('Failure category: ' + (error.message.startsWith('Behavior mismatch') ? error.message : 'assertion'))
  console.log('Failure location: ' + String(error.stack).split('\n').slice(1, 3).join(' '))
  console.log('FAIL: offline checks failed; fixture values suppressed.')
  process.exitCode = 1
} finally { console.error = originalError }
