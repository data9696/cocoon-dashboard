import { useMemo } from 'react'
import { useData } from '../lib/DataContext'
import { PageLayout } from '../components/PageLayout'
import { InventoryTable } from '../components/InventoryTable'
import { InventoryCharts } from '../components/InventoryCharts'
import { formatDisplayDate } from '../lib/dateLogic'

export function Inventory() {
  const { stock } = useData()

  const latestStockDate = useMemo(() => {
    let latest = ''
    for (const s of stock) {
      if (s.snapshot_date && s.snapshot_date > latest) latest = s.snapshot_date
    }
    return latest
  }, [stock])

  const latestStock = useMemo(
    () => stock.filter((s) => s.snapshot_date === latestStockDate),
    [stock, latestStockDate]
  )

  return (
    <PageLayout
      title="Inventory"
      subtitle={`Latest stock snapshot: ${formatDisplayDate(latestStockDate)} · ${latestStock.length.toLocaleString()} SKUs`}
    >
      <div className="mb-8">
        <InventoryCharts latestStock={latestStock} allStock={stock} />
      </div>
      <InventoryTable rows={latestStock} />
    </PageLayout>
  )
}
