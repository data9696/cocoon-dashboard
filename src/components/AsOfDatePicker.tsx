import { useData } from '../lib/DataContext'
import { formatDisplayDate } from '../lib/dateLogic'

export function AsOfDatePicker() {
  const { asOfDate, trueLatestDate, setAsOfDate } = useData()
  const isOverridden = asOfDate !== trueLatestDate

  return (
    <div className="flex items-center gap-3">
      <label className="text-xs text-[var(--color-muted)] uppercase tracking-wide">
        As of
      </label>
      <input
        type="date" lang="en-GB"
        value={asOfDate || ''}
        max={trueLatestDate || undefined}
        onChange={(e) => setAsOfDate(e.target.value || null)}
        className="text-sm border border-[var(--color-border)] rounded-lg px-3 py-1.5 bg-[var(--color-surface)]"
      />
      {isOverridden && (
        <button
          onClick={() => setAsOfDate(null)}
          className="text-xs text-[var(--color-sage-dark)] underline"
        >
          Reset to latest ({formatDisplayDate(trueLatestDate)})
        </button>
      )}
    </div>
  )
}