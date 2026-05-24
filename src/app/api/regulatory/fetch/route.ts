/**
 * POST /api/regulatory/fetch
 * Called by Vercel Cron Job daily (or manually from compliance page).
 * Fetches USCIS + Federal Register feeds, runs AI analysis,
 * stores new alerts in the database.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  FEED_SOURCES,
  parseRssFeed,
  parseFederalRegister,
  detectAlertType,
  detectSeverity,
  matchVisaTypes,
  generateAiSummary,
  isNewItem,
} from '@/lib/regulatoryEngine'

// Vercel Cron auth — set CRON_SECRET in your Vercel environment variables
const CRON_SECRET = process.env.CRON_SECRET

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const isLocal    = process.env.NODE_ENV === 'development'
  const isCron     = CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`

  if (!isCron && !isLocal) {
    const body = await req.json().catch(() => ({}))
    if (!CRON_SECRET || body?.secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const apiKey = process.env.ANTHROPIC_API_KEY ?? ''
  const results = { fetched: 0, inserted: 0, skipped: 0, errors: [] as string[] }

  // Load existing external IDs to deduplicate
  const existing = await prisma.regulatoryAlert.findMany({
    select: { externalId: true },
    where:  { externalId: { not: null } },
  })
  const existingIds = new Set(existing.map(e => e.externalId!))

  for (const source of FEED_SOURCES) {
    try {
      const res = await fetch(source.url, {
        headers: { 'User-Agent': 'ImmigAI/1.0 regulatory-monitor' },
        signal:  AbortSignal.timeout(10000),
      })

      if (!res.ok) {
        results.errors.push(`${source.name}: HTTP ${res.status}`)
        continue
      }

      const contentType = res.headers.get('content-type') ?? ''
      let items: { title: string; description: string; link: string; pubDate: string; guid: string }[] = []

      if (contentType.includes('json') || source.type === 'federal_register') {
        const json = await res.json()
        items = parseFederalRegister(json)
      } else {
        const xml = await res.text()
        items = parseRssFeed(xml)
      }

      results.fetched += items.length

      for (const item of items.slice(0, 10)) { // max 10 per source per run
        if (!isNewItem(item.guid, existingIds)) {
          results.skipped++
          continue
        }

        const fullText    = `${item.title} ${item.description}`
        const alertType   = detectAlertType(item.title, item.description)
        const severity    = detectSeverity(item.title, item.description, alertType)
        const { visaTypes, affectsAll } = matchVisaTypes(item.title, item.description)

        // Generate AI summary (uses Haiku for cost efficiency)
        const summary = apiKey
          ? await generateAiSummary(item.title, item.description, visaTypes, apiKey)
          : item.description.replace(/<[^>]+>/g, ' ').trim().slice(0, 300)

        let publishedAt: Date | null = null
        if (item.pubDate) {
          const parsed = new Date(item.pubDate)
          if (!isNaN(parsed.getTime())) publishedAt = parsed
        }

        await prisma.regulatoryAlert.create({
          data: {
            alertType,
            severity,
            title:            item.title.slice(0, 500),
            summary:          summary.slice(0, 1000),
            fullContent:      item.description.slice(0, 5000),
            sourceUrl:        item.link   || null,
            sourceName:       source.name,
            affectedVisaTypes: JSON.stringify(visaTypes),
            affectsAllCases:  affectsAll,
            externalId:       item.guid.slice(0, 500),
            publishedAt,
          },
        })

        existingIds.add(item.guid)
        results.inserted++
      }
    } catch (err: any) {
      results.errors.push(`${source.name}: ${err.message ?? 'unknown error'}`)
    }
  }

  return NextResponse.json({ success: true, ...results })
}

// GET — manual trigger from the UI "Refresh" button
export async function GET(req: NextRequest) {
  return POST(req)
}
