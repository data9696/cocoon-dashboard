import { useMemo, useState } from 'react'
import { AlertTriangle, AlertOctagon, Send, Sparkles, Loader2 } from 'lucide-react'
import { useData } from '../lib/DataContext'
import { generateWarnings } from '../lib/insightWarnings'
import {
  yesterdayFromSummary,
  weekOverWeekFromSummary,
  monthOverMonthFromSummary,
} from '../lib/summaryAggregations'

export function InsightsWarningsCard() {
  const { sales, dailySummary, skuStyleMap, asOfDate } = useData()
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState<{ from: 'user' | 'bot'; text: string }[]>([])
  const [sending, setSending] = useState(false)

  const warnings = useMemo(
    () => generateWarnings(dailySummary, sales, skuStyleMap, asOfDate),
    [dailySummary, sales, skuStyleMap, asOfDate]
  )

  async function handleSend() {
    if (!chatInput.trim() || sending) return
    const userText = chatInput.trim()
    setChatMessages((prev) => [...prev, { from: 'user', text: userText }])
    setChatInput('')
    setSending(true)

    const yesterday = yesterdayFromSummary(dailySummary, asOfDate)
    const week = weekOverWeekFromSummary(dailySummary, asOfDate)
    const month = monthOverMonthFromSummary(dailySummary, asOfDate)

    const context = {
      asOfDate,
      yesterday_sales: yesterday.sales,
      this_week_sales: week.current.sales,
      last_week_sales: week.prior.sales,
      this_month_sales: month.current.sales,
      last_month_sales: month.prior.sales,
      warnings: warnings.map((w) => ({ title: w.title, detail: w.detail, changePct: w.changePct })),
    }

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, context }),
      })
      const data = await res.json()
      setChatMessages((prev) => [...prev, { from: 'bot', text: data.reply || data.error || 'No response.' }])
    } catch (err) {
      setChatMessages((prev) => [...prev, { from: 'bot', text: 'Something went wrong reaching the assistant.' }])
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg flex items-center gap-2">
          <Sparkles size={18} className="text-[var(--color-sage-dark)]" />
          Insights & Warnings
        </h3>
        <span className="text-xs text-[var(--color-muted)]">Last 10 days</span>
      </div>

      {warnings.length === 0 ? (
        <div className="text-sm text-[var(--color-muted)] py-4 text-center">
          ✅ No significant drops detected across brands, channels, or categories.
        </div>
      ) : (
        <div className="space-y-2 mb-4 max-h-80 overflow-y-auto">
          {warnings.map((w) => (
            <div
              key={w.id}
              className={`flex items-start gap-2.5 p-3 rounded-lg ${
                w.severity === 'critical' ? 'bg-[#fee2e2]' : 'bg-[#fef3c7]'
              }`}
            >
              {w.severity === 'critical' ? (
                <AlertOctagon size={16} className="text-[#dc2626] shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle size={16} className="text-[#b45309] shrink-0 mt-0.5" />
              )}
              <div>
                <div className={`text-sm font-medium ${w.severity === 'critical' ? 'text-[#991b1b]' : 'text-[#92400e]'}`}>
                  {w.title} ({w.changePct.toFixed(0)}%)
                </div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">{w.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-[var(--color-border)] pt-4">
        <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">Ask about this data</div>
        {chatMessages.length > 0 && (
          <div className="space-y-2 mb-3 max-h-48 overflow-y-auto">
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={`text-sm px-3 py-2 rounded-lg max-w-[85%] ${
                  m.from === 'user'
                    ? 'bg-[var(--color-sage-light)] ml-auto text-[var(--color-sage-dark)]'
                    : 'bg-[var(--color-cream)] text-[var(--color-charcoal)]'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="e.g. Why did Cocoon Care sales drop this week?"
            disabled={sending}
            className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-sage)] disabled:opacity-60"
          />
          <button
            onClick={handleSend}
            disabled={sending}
            className="px-3 py-2 rounded-lg bg-[var(--color-sage)] text-white hover:opacity-90 disabled:opacity-60"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
