import { supabase } from './supabase-client'

export async function logMigration(
  bubbleId: string,
  supabaseId: string,
  tableName: string,
): Promise<void> {
  const { error } = await supabase.from('bubble_migration_log').upsert(
    { bubble_id: bubbleId, supabase_id: supabaseId, table_name: tableName },
    { onConflict: 'bubble_id,table_name' },
  )
  if (error) throw new Error(`Migration log failed [${tableName}/${bubbleId}]: ${error.message}`)
}

export async function getSupabaseId(
  bubbleId: string,
  tableName: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('bubble_migration_log')
    .select('supabase_id')
    .eq('bubble_id', bubbleId)
    .eq('table_name', tableName)
    .maybeSingle()
  return data?.supabase_id ?? null
}

export async function buildIdMap(tableName: string): Promise<Map<string, string>> {
  const { data, error } = await supabase
    .from('bubble_migration_log')
    .select('bubble_id, supabase_id')
    .eq('table_name', tableName)

  if (error) throw new Error(`buildIdMap failed [${tableName}]: ${error.message}`)

  const map = new Map<string, string>()
  for (const row of data ?? []) map.set(row.bubble_id, row.supabase_id)
  return map
}
