<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Filler,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type Plugin,
  type ScriptableContext,
} from 'chart.js'
import type { WeekDayBucket } from '../composables/useWeeklyEventsChart'

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, Filler, Tooltip)

const props = defineProps<{
  buckets: WeekDayBucket[]
}>()

const labels = computed(() => props.buckets.map((b) => b.shortLabel))
const values = computed(() => props.buckets.map((b) => b.count))

const areaGradient = (ctx: ScriptableContext<'line'>) => {
  const { chart } = ctx
  const { ctx: canvas, chartArea } = chart
  if (!chartArea) return 'rgba(150,136,207,0.15)'
  const gradient = canvas.createLinearGradient(0, chartArea.top, 0, chartArea.bottom)
  gradient.addColorStop(0, 'rgba(150,136,207,0.30)')
  gradient.addColorStop(1, 'rgba(150,136,207,0)')
  return gradient
}

const chartData = computed<ChartData<'line'>>(() => ({
  labels: labels.value,
  datasets: [
    {
      data: values.value,
      borderColor: '#9688CF',
      borderDash: [4, 4],
      borderWidth: 2,
      tension: 0.45,
      fill: 'origin',
      backgroundColor: areaGradient,
      pointRadius: 0,
      pointHoverRadius: 6,
      pointHoverBackgroundColor: '#9688CF',
      pointHoverBorderColor: '#ffffff',
      pointHoverBorderWidth: 2,
    },
  ],
}))

const valueLabelsPlugin: Plugin<'line'> = {
  id: 'eventsValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart
    const meta = chart.getDatasetMeta(0)
    if (!meta?.data?.length) return

    ctx.save()
    ctx.font = '500 14px Inter, sans-serif'
    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    meta.data.forEach((point, i) => {
      const value = values.value[i] ?? 0
      if (value === 0) return
      ctx.fillText(String(value), point.x, point.y - 8)
    })

    ctx.restore()
  },
}

const chartOptions = computed<ChartOptions<'line'>>(() => {
  const max = Math.max(...values.value, 1)
  return {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: { top: 28, right: 16, bottom: 8, left: 16 },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        enabled: true,
        backgroundColor: '#0a0a0a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        padding: 8,
        displayColors: false,
        callbacks: {
          title: (items) => {
            const idx = items[0]?.dataIndex ?? 0
            return props.buckets[idx]?.shortLabel ?? ''
          },
          label: (item) => `${item.parsed.y} event${item.parsed.y === 1 ? '' : 's'}`,
        },
      },
    },
    scales: {
      x: { display: false },
      y: {
        display: false,
        beginAtZero: true,
        suggestedMax: max + Math.max(2, Math.ceil(max * 0.3)),
      },
    },
    interaction: {
      mode: 'nearest',
      intersect: false,
      axis: 'x',
    },
  }
})
</script>

<template>
  <div class="relative h-[192px] w-full">
    <Line :data="chartData" :options="chartOptions" :plugins="[valueLabelsPlugin]" />
  </div>
</template>
