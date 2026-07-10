import { RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts'

export function TargetProgress({
  current,
  target,
}: {
  current: number
  target: number
}) {
  const pct = target > 0 ? (current / target) * 100 : 0
  const gaugeValue = Math.min(pct, 100)
  const inr = (n: number) => '₹' + Math.round(n).toLocaleString('en-IN')
  const hit = pct >= 100

  const data = [{ name: 'progress', value: gaugeValue, fill: hit ? '#15803d' : '#e8c468' }]

  return (
    <div className="card p-5 h-full">
      <div className="text-xs uppercase tracking-wide text-[var(--color-muted)] mb-2">
        Monthly Target Progress
      </div>

      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-32 h-32 shrink-0">
          <RadialBarChart
            width={128}
            height={128}
            cx={64}
            cy={64}
            innerRadius={48}
            outerRadius={64}
            barSize={12}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar dataKey="value" cornerRadius={8} background={{ fill: 'var(--color-border)' }} />
          </RadialBarChart>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="font-display text-xl text-[var(--color-charcoal)]">
              {pct.toFixed(0)}%
            </div>
            <div className="text-[10px] text-[var(--color-muted)]">of target</div>
          </div>
        </div>

        <div>
          <div className="font-display text-xl text-[var(--color-sage-dark)]">
            {inr(current)}
          </div>
          <div className="text-xs text-[var(--color-muted)] mb-2">Achieved this month</div>
          <div className="font-display text-lg text-[var(--color-charcoal)]">{inr(target)}</div>
          <div className="text-xs text-[var(--color-muted)]">Monthly Target</div>
        </div>
      </div>

      {hit ? (
        <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-sage-light)] text-[var(--color-sage-dark)] text-sm">
          🎉 You've exceeded the target
        </div>
      ) : (
        <div className="mt-3 px-3 py-2 rounded-lg bg-[var(--color-corn-light)] text-[#8a6a1f] text-sm">
          {inr(target - current)} to go to hit target
        </div>
      )}
    </div>
  )
}