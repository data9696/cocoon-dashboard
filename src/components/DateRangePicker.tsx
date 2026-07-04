import { useState } from 'react'
import { addDays, mondayOfWeek, firstOfMonth } from '../lib/dateLogic'

export type DateRange = { start: string; end: string; label: string }

const PRESETS = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'] as const
type Preset = typeof PRESETS[number]

function getPresetRange(preset: Preset, asOf: string): DateRange | null {
  if (preset === 'Custom') return null
  if (preset === 'Today') return { start: asOf, end: asOf, label: 'Today' }
  if (preset === 'Yesterday') {
    const y = addDays(asOf, -1)
    return { start: y, end: y, label: 'Yesterday' }
  }
  if (preset === 'This Week') {
    const mon = mondayOfWeek(asOf)
    return { start: mon, end: asOf, label: 'This Week' }
  }
  if (preset === 'This Month') {
    const first = firstOfMonth(asOf)
    return { start: first, end: asOf, label: 'This Month' }
  }
  return null
}

interface Props {
  asOf: string
  onChange: (range: DateRange) => void
}

export function DateRangePicker({ asOf, onChange }: Props) {
  const [active, setActive] = useState<Preset>('This Month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')

  function selectPreset(preset: Preset) {
    setActive(preset)
    if (preset !== 'Custom') {
      const range = getPresetRange(preset, asOf)
      if (range) onChange(range)
    }
  }

  function applyCustom() {
    if (!customStart || !customEnd) return
    const start = customStart < customEnd ? customStart : customEnd
    const end = customStart < customEnd ? customEnd : customStart
    onChange({ start, end, label: `${start} → ${end}` })
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      {PRESETS.map((preset) => (
        <button
          key={preset}
          onClick={() => selectPreset(preset)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
            active === preset
              ? 'bg-[var(--color-sage)] text-white shadow-md scale-105'
              : 'bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-charcoal)] hover:border-[var(--color-sage)] hover:text-[var(--color-sage-dark)]'
          }`}
        >
          {preset}
        </button>
      ))}

      {active === 'Custom' && (
        <div className="flex items-center gap-2 ml-2">
          <input
            type="date" lang="en-GB"
            value={customStart}
            max={asOf}
            onChange={(e) => setCustomStart(e.target.value)}
            className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]"
          />
          <span className="text-[var(--color-muted)] text-sm">→</span>
          <input
            type="date" lang="en-GB"
            value={customEnd}
            max={asOf}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]"
          />
          <button
            onClick={applyCustom}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-sage)] text-white text-sm font-medium hover:bg-[var(--color-sage-dark)] transition-colors"
          >
            Apply
          </button>
        </div>
      )}
    </div>
  )
}

export function defaultDateRange(asOf: string): DateRange {
  return { start: firstOfMonth(asOf), end: asOf, label: 'This Month' }
}