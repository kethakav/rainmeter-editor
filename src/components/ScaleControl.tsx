import React from 'react'
import { Button } from '@/components/ui/button'
import { Minus, Plus } from 'lucide-react'

interface ScaleControlProps {
  scale: number
  onScaleChange: (newScale: number) => void
  min?: number
  max?: number
  step?: number
}

const ScaleControl: React.FC<ScaleControlProps> = ({
  scale,
  onScaleChange,
  min = 25,
  max = 400,
  step = 25,
}) => {
  const handleDecrease = () => {
    const newScale = Math.max(min, scale - step)
    onScaleChange(newScale)
  }

  const handleIncrease = () => {
    const newScale = Math.min(max, scale + step)
    onScaleChange(newScale)
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-900 rounded-lg p-1 text-white">
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDecrease}
        disabled={scale <= min}
        className="h-8 w-8 text-white hover:bg-zinc-800 hover:text-white"
      >
        <Minus className="h-4 w-4" />
      </Button>
      <div className="w-16 text-center text-sm tabular-nums">
        {scale}%
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleIncrease}
        disabled={scale >= max}
        className="h-8 w-8 text-white hover:bg-zinc-800 hover:text-white"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  )
}

export default ScaleControl

