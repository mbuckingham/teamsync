import { useCallback, useMemo, useRef, useState } from 'react'
import { rotateArray } from '@giraugh/tools'

import { useDayjs } from '/src/config/dayjs'
import { useTranslation } from '/src/i18n/client'
import { useStore } from '/src/stores'
import useSettingsStore from '/src/stores/settingsStore'
import { makeClass } from '/src/utils'

// Use styles from Month picker
import styles from '../Month/Month.module.scss'

interface WeekdaysProps {
  /** Array of weekdays as numbers from 0-6 (as strings) */
  value: string[]
  onChange: (value: string[]) => void
}

const Weekdays = ({ value, onChange }: WeekdaysProps) => {
  const { t } = useTranslation('home')
  const dayjs = useDayjs()

  const weekStart = useStore(useSettingsStore, state => state.weekStart) ?? 0

  const weekdays = useMemo(() => rotateArray(dayjs.weekdaysShort().map((name, i) => ({
    name,
    isToday: dayjs().day() === i,
    str: String(i),
  })), -weekStart), [weekStart])

  // Ref and state required to rerender but also access static version in callbacks
  const selectingRef = useRef<string[]>([])
  const [selecting, _setSelecting] = useState<string[]>([])
  const setSelecting = useCallback((v: string[]) => {
    selectingRef.current = v
    _setSelecting(v)
  }, [])

  const startPos = useRef(0)
  const mode = useRef<'add' | 'remove'>()

  const handleFinishSelection = useCallback(() => {
    if (mode.current === 'add') {
      onChange([...value, ...selectingRef.current])
    } else {
      onChange(value.filter(d => !selectingRef.current.includes(d)))
    }
    mode.current = undefined
  }, [value])

  return <div className={styles.grid}>
    {weekdays.map((day, i) =>
      <button
        type="button"
        className={makeClass(
          styles.date,
          day.isToday && styles.today,
          (
            (!(mode.current === 'remove' && selecting.includes(day.str)) && value.includes(day.str))
            || (mode.current === 'add' && selecting.includes(day.str))
          ) && styles.selected,
        )}
        key={day.name}
        title={day.isToday ? t<string>('form.dates.tooltips.today') : undefined}
        onKeyDown={e => {
          if (e.key === ' ' || e.key === 'Enter') {
            if (value.includes(day.str)) {
              onChange(value.filter(d => d !== day.str))
            } else {
              onChange([...value, day.str])
            }
          }
        }}
        onPointerDown={e => {
          startPos.current = i
          mode.current = value.includes(day.str) ? 'remove' : 'add'
          setSelecting([day.str])
          e.currentTarget.releasePointerCapture(e.pointerId)

          document.addEventListener('pointerup', handleFinishSelection, { once: true })
        }}
        onPointerEnter={() => {
          if (mode.current) {
            const found = []
            for (let ci = Math.min(startPos.current, i); ci < Math.max(startPos.current, i) + 1; ci++) {
              found.push(weekdays[ci].str)
            }
            setSelecting(found)
          }
        }}
      >{day.name}</button>
    )}
  </div>
}

export default Weekdays
