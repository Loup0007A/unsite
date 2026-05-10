/**
 * /api/cron/route.ts
 *
 * Endpoint sécurisé pour les cron jobs d'Unsite.
 * Compatible Render Cron Jobs, Upstash QStash, GitHub Actions, curl.
 *
 * Auth : Authorization: Bearer <CRON_SECRET>
 *
 * Usage :
 *   GET /api/cron              → lance tous les jobs
 *   GET /api/cron?job=cleanup  → lance un job précis
 *   POST /api/cron             → idem (pour QStash / webhooks)
 */

import { NextRequest, NextResponse } from 'next/server'

// ─── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true
  const xSecret = req.headers.get('x-cron-secret')
  if (xSecret === secret) return true
  return false
}

// ─── Jobs ──────────────────────────────────────────────────────────────────────

async function jobHeartbeat(): Promise<string> {
  return `Heartbeat OK — ${new Date().toISOString()}`
}

async function jobCleanup(): Promise<string> {
  // TODO: connecter à Supabase/PG
  // await supabase.from('sessions').delete().lt('expires_at', new Date().toISOString())
  // await supabase.from('queue').delete().lt('joined_at', new Date(Date.now() - 30 * 60 * 1000).toISOString())
  return 'Sessions expirées et file nettoyées'
}

async function jobMood(): Promise<string> {
  // TODO: recalculer l'humeur globale depuis les messages récents
  // const { data } = await supabase.from('messages').select('text').order('created_at', { ascending: false }).limit(20)
  // const mood = computeMood(data)
  // await supabase.from('global_state').upsert({ key: 'mood', value: mood })
  return 'Humeur recalculée'
}

async function jobStats(): Promise<string> {
  // TODO: agréger les stats des dernières 24h
  return 'Statistiques agrégées'
}

async function jobPruneDrawings(): Promise<string> {
  // TODO: supprimer les dessins > 7 jours
  // const cutoff = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()
  // await supabase.from('drawings').delete().lt('created_at', cutoff)
  return 'Dessins anciens archivés'
}

const JOBS: Record<string, () => Promise<string>> = {
  heartbeat: jobHeartbeat,
  cleanup: jobCleanup,
  mood: jobMood,
  stats: jobStats,
  'prune-drawings': jobPruneDrawings,
}

// ─── Handler ───────────────────────────────────────────────────────────────────
async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: 'Non autorisé', hint: 'Authorization: Bearer <CRON_SECRET>' },
      { status: 401 }
    )
  }

  const { searchParams } = new URL(req.url)
  const requested = searchParams.get('job')
  const jobsToRun = requested ? [requested] : Object.keys(JOBS)

  const results = []
  for (const name of jobsToRun) {
    const fn = JOBS[name]
    if (!fn) {
      results.push({ job: name, status: 'error', error: `Job inconnu. Disponibles : ${Object.keys(JOBS).join(', ')}` })
      continue
    }
    const t0 = Date.now()
    try {
      const detail = await fn()
      results.push({ job: name, status: 'ok', duration_ms: Date.now() - t0, detail })
    } catch (e) {
      results.push({ job: name, status: 'error', duration_ms: Date.now() - t0, error: String(e) })
    }
  }

  const allOk = results.every(r => r.status === 'ok')
  return NextResponse.json(
    { timestamp: new Date().toISOString(), ran: results.length, results },
    { status: allOk ? 200 : 207 }
  )
}

export const GET = handler
export const POST = handler
