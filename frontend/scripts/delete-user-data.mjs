import { createClient } from '@supabase/supabase-js'

const DELETE_CONFIRMATION = 'EXCLUIR CONTA E DADOS'
const args = new Map()
for (let index = 2; index < process.argv.length; index += 1) {
  const key = process.argv[index]
  if (!key.startsWith('--')) continue
  const value = process.argv[index + 1]?.startsWith('--') ? true : process.argv[++index] ?? true
  args.set(key, value)
}

const email = String(args.get('--email') ?? '').trim().toLowerCase()
const execute = args.has('--execute')
const confirmation = String(args.get('--confirm') ?? '')
const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

if (!email || !email.includes('@')) throw new Error('Informe --email com a conta exata.')
if (!url || !serviceRole) throw new Error('Configure as variáveis Supabase server-side somente nesta sessão.')
if (execute && confirmation !== DELETE_CONFIRMATION) {
  throw new Error(`Para executar, informe --confirm "${DELETE_CONFIRMATION}".`)
}

const admin = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
})

async function findUser() {
  for (let page = 1; ; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error
    const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email)
    if (user) return user
    if (data.users.length < 1000) return null
  }
}

async function listFiles(bucket, prefix) {
  const result = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await admin.storage.from(bucket).list(prefix, {
      limit: 1000,
      offset,
      sortBy: { column: 'name', order: 'asc' },
    })
    if (error) throw error
    for (const item of data ?? []) {
      const path = `${prefix}/${item.name}`
      if (item.id) result.push(path)
      else result.push(...await listFiles(bucket, path))
    }
    if ((data ?? []).length < 1000) break
  }
  return result
}

const user = await findUser()
if (!user) throw new Error('Conta não encontrada; nenhuma alteração foi feita.')

const { data: buckets, error: bucketsError } = await admin.storage.listBuckets()
if (bucketsError) throw bucketsError

const files = []
for (const bucket of buckets ?? []) {
  for (const path of await listFiles(bucket.id, user.id)) files.push({ bucket: bucket.id, path })
}

console.log(JSON.stringify({ modo: execute ? 'execucao' : 'simulacao', conta: email, arquivos: files.length }, null, 2))
if (!execute) {
  console.log(`Simulação concluída. Para executar, repita com --execute --confirm "${DELETE_CONFIRMATION}".`)
  process.exit(0)
}

for (const bucket of buckets ?? []) {
  const paths = files.filter((file) => file.bucket === bucket.id).map((file) => file.path)
  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await admin.storage.from(bucket.id).remove(paths.slice(index, index + 100))
    if (error) throw new Error(`Falha ao apagar arquivos do bucket ${bucket.id}; conta preservada. ${error.message}`)
  }
}

const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
if (deleteError) throw new Error(`Arquivos apagados, mas a conta não foi removida: ${deleteError.message}`)

console.log(JSON.stringify({ concluido: true, conta: email, arquivos_removidos: files.length }, null, 2))

