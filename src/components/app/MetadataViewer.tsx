'use client'

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'

interface MetadataViewerProps {
  exifData: Record<string, unknown>
  xmpData: Record<string, unknown>
  iptcData: Record<string, unknown>
  rawData: Record<string, unknown>
}

// Fields that may indicate suspicious post-processing
const SUSPICIOUS_KEYS = new Set([
  'Software',
  'CreatorTool',
  'HistorySoftwareAgent',
  'HistoryParameters',
  'DerivedFromDocumentID',
  'DocumentID',
  'InstanceID',
  'OriginalDocumentID',
])

const SUSPICIOUS_VALUES = ['photoshop', 'lightroom', 'capture one', 'gimp', 'affinity', 'luminar', 'darktable']

const IMPORTANT_EXIF_KEYS = [
  'Make',
  'Model',
  'LensModel',
  'DateTimeOriginal',
  'CreateDate',
  'ModifyDate',
  'Software',
  'GPSLatitude',
  'GPSLongitude',
  'GPSAltitude',
  'ExposureTime',
  'FNumber',
  'ISO',
  'FocalLength',
  'Flash',
  'ColorSpace',
  'ImageWidth',
  'ImageHeight',
  'Orientation',
  'ResolutionUnit',
  'XResolution',
  'YResolution',
  'ExifVersion',
  'Artist',
  'Copyright',
  'ImageDescription',
]

type TabKey = 'exif' | 'xmp' | 'iptc' | 'full'

function isSuspicious(key: string, value: unknown): boolean {
  if (SUSPICIOUS_KEYS.has(key)) {
    const strVal = String(value).toLowerCase()
    return SUSPICIOUS_VALUES.some((v) => strVal.includes(v))
  }
  return false
}

function ValueCell({ value }: { value: unknown }) {
  const [expanded, setExpanded] = useState(false)
  const str = value === null || value === undefined ? '—' : String(value)
  const truncated = str.length > 100 && !expanded

  return (
    <div className="flex items-start gap-1">
      <span className="font-mono text-xs text-foreground break-all">
        {truncated ? `${str.slice(0, 100)}…` : str}
      </span>
      {str.length > 100 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 text-[10px] text-primary underline underline-offset-2 mt-0.5"
        >
          {expanded ? 'less' : 'more'}
        </button>
      )}
    </div>
  )
}

function MetadataTable({
  data,
  priorityKeys,
  showSearch,
}: {
  data: Record<string, unknown>
  priorityKeys?: string[]
  showSearch?: boolean
}) {
  const [search, setSearch] = useState('')

  const entries = useMemo(() => {
    const all = Object.entries(data)

    // Extract flags array if present
    const withoutFlags = all.filter(([k]) => k !== 'flags')

    let sorted = withoutFlags
    if (priorityKeys && priorityKeys.length > 0) {
      const prioritySet = new Set(priorityKeys)
      const priority = withoutFlags.filter(([k]) => prioritySet.has(k))
      const rest = withoutFlags.filter(([k]) => !prioritySet.has(k))
      sorted = [...priority, ...rest]
    }

    if (!search.trim()) return sorted
    const q = search.trim().toLowerCase()
    return sorted.filter(
      ([k, v]) =>
        k.toLowerCase().includes(q) || String(v).toLowerCase().includes(q)
    )
  }, [data, priorityKeys, search])

  const flags = Array.isArray((data as any).flags) ? (data as any).flags as string[] : []

  if (Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
        <Search className="size-8 opacity-30" />
        <p className="text-sm">No data available for this category.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Flags */}
      {flags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {flags.map((flag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            >
              <AlertTriangle className="size-3" />
              {flag}
            </span>
          ))}
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search metadata…"
            className="pl-8 h-8 text-xs"
          />
        </div>
      )}

      {/* Table */}
      {entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">No results match your search.</p>
      ) : (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground w-2/5">Field</th>
                <th className="px-3 py-2 text-left font-semibold text-muted-foreground">Value</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value], i) => {
                const suspicious = isSuspicious(key, value)
                return (
                  <tr
                    key={key}
                    className={cn(
                      'border-b last:border-0 transition-colors',
                      suspicious
                        ? 'bg-amber-50/60 dark:bg-amber-900/10'
                        : i % 2 === 0
                        ? 'bg-transparent'
                        : 'bg-muted/20'
                    )}
                  >
                    <td className="px-3 py-2 align-top">
                      <div className="flex items-center gap-1.5">
                        {suspicious && (
                          <AlertTriangle className="size-3 shrink-0 text-amber-500" />
                        )}
                        <span
                          className={cn(
                            'font-medium break-all',
                            suspicious
                              ? 'text-amber-700 dark:text-amber-400'
                              : 'text-foreground'
                          )}
                        >
                          {key}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top">
                      <ValueCell value={value} />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const TABS: { key: TabKey; label: string }[] = [
  { key: 'exif', label: 'EXIF' },
  { key: 'xmp', label: 'XMP' },
  { key: 'iptc', label: 'IPTC' },
  { key: 'full', label: 'Full Metadata' },
]

export function MetadataViewer({ exifData, xmpData, iptcData, rawData }: MetadataViewerProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('exif')

  return (
    <div className="rounded-xl border bg-card shadow-sm">
      {/* Tabs header */}
      <div className="flex border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'shrink-0 px-4 py-3 text-xs font-semibold transition-colors border-b-2 -mb-px',
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-4">
        {activeTab === 'exif' && (
          <MetadataTable data={exifData} priorityKeys={IMPORTANT_EXIF_KEYS} showSearch />
        )}
        {activeTab === 'xmp' && (
          <MetadataTable data={xmpData} showSearch />
        )}
        {activeTab === 'iptc' && (
          <MetadataTable data={iptcData} showSearch />
        )}
        {activeTab === 'full' && (
          <MetadataTable data={rawData} showSearch />
        )}
      </div>
    </div>
  )
}
