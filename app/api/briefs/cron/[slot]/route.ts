import { GET as runScheduler } from '../route'

// Hourly scheduler ticks. On Vercel's Hobby plan a cron job may run at most once a
// day, so vercel.json lists one daily job per hour (/api/briefs/cron/h00 … h23) that
// all land here. On Pro these can be replaced by a single "0 * * * *" job pointing at
// /api/briefs/cron. The slot name is only a label — the scheduler works out what is
// due from the clock, so a tick that arrives late or twice is harmless.
export const maxDuration = 300

export async function GET(request: Request) {
  return runScheduler(request)
}
