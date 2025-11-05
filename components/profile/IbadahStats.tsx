"use client"

import React, { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { motion } from 'framer-motion'
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js'
import { Doughnut, Bar } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement)

import { supabase } from '@/lib/supabaseClient'


interface IbadahData {
  prayers_completed: number
  fasting_days: number
  dhikr_count: number
  quran_pages: number
}

interface IbadahStatsProps {
  userId: number
}

export default function IbadahStats({ userId }: IbadahStatsProps) {
  const [ibadahData, setIbadahData] = useState<IbadahData>({
    prayers_completed: 0,
    fasting_days: 0,
    dhikr_count: 0,
    quran_pages: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIbadahData()
  }, [userId])

  const fetchIbadahData = async () => {
    try {
      const { data, error } = await supabase
        .from('ibadah_tracking')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (data) {
        setIbadahData(data)
      }
    } catch (error) {
      console.error('Error fetching ibadah data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate ibadah level (0-100%)
  const calculateIbadahLevel = () => {
    const prayerScore = Math.min((ibadahData.prayers_completed / 150) * 100, 100)
    const fastingScore = Math.min((ibadahData.fasting_days / 30) * 100, 100)
    const dhikrScore = Math.min((ibadahData.dhikr_count / 10000) * 100, 100)
    const quranScore = Math.min((ibadahData.quran_pages / 604) * 100, 100)
    
    return Math.round((prayerScore + fastingScore + dhikrScore + quranScore) / 4)
  }

  const ibadahLevel = calculateIbadahLevel()

  // Chart data
  const doughnutData = {
    labels: ['Prayers', 'Fasting', 'Dhikr', 'Quran'],
    datasets: [{
      data: [
        ibadahData.prayers_completed,
        ibadahData.fasting_days * 5, // Weight fasting more
        ibadahData.dhikr_count / 100, // Scale down dhikr
        ibadahData.quran_pages * 2 // Weight Quran
      ],
      backgroundColor: [
        'rgba(251, 191, 36, 0.8)', // Amber
        'rgba(34, 197, 94, 0.8)',  // Green
        'rgba(59, 130, 246, 0.8)', // Blue
        'rgba(168, 85, 247, 0.8)'  // Purple
      ],
      borderColor: [
        'rgb(251, 191, 36)',
        'rgb(34, 197, 94)',
        'rgb(59, 130, 246)',
        'rgb(168, 85, 247)'
      ],
      borderWidth: 2
    }]
  }

  const barData = {
    labels: ['Prayers', 'Fasting', 'Dhikr', 'Quran'],
    datasets: [{
      label: 'Ibadah Progress',
      data: [
        ibadahData.prayers_completed,
        ibadahData.fasting_days,
        ibadahData.dhikr_count / 100,
        ibadahData.quran_pages
      ],
      backgroundColor: 'rgba(251, 191, 36, 0.8)',
      borderColor: 'rgb(251, 191, 36)',
      borderWidth: 2,
      borderRadius: 8
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(148, 163, 184)',
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        titleColor: 'rgb(251, 191, 36)',
        bodyColor: 'rgb(226, 232, 240)',
        borderColor: 'rgb(251, 191, 36)',
        borderWidth: 1,
        padding: 12,
        displayColors: true
      }
    }
  }

  if (loading) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-6 flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <motion.div 
      className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      {/* Ibadah Level Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-amber-500">Ibadah Level</h3>
          <span className="text-2xl font-bold text-amber-500">{ibadahLevel}%</span>
        </div>
        
        <div className="relative w-full h-4 bg-muted rounded-full overflow-hidden">
          <motion.div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${ibadahLevel}%` }}
            transition={{ duration: 1, delay: 0.6 }}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <motion.div 
          className="text-center p-4 bg-amber-500/10 rounded-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-2xl font-bold text-amber-500">{ibadahData.prayers_completed}</div>
          <div className="text-xs text-muted-foreground mt-1">Prayers</div>
        </motion.div>
        
        <motion.div 
          className="text-center p-4 bg-green-500/10 rounded-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-2xl font-bold text-green-500">{ibadahData.fasting_days}</div>
          <div className="text-xs text-muted-foreground mt-1">Fasts</div>
        </motion.div>
        
        <motion.div 
          className="text-center p-4 bg-blue-500/10 rounded-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-2xl font-bold text-blue-500">{ibadahData.dhikr_count}</div>
          <div className="text-xs text-muted-foreground mt-1">Dhikr</div>
        </motion.div>
        
        <motion.div 
          className="text-center p-4 bg-purple-500/10 rounded-lg"
          whileHover={{ scale: 1.05 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="text-2xl font-bold text-purple-500">{ibadahData.quran_pages}</div>
          <div className="text-xs text-muted-foreground mt-1">Quran Pages</div>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="h-64">
          <Doughnut data={doughnutData} options={chartOptions} />
        </div>
        <div className="h-64">
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>
    </motion.div>
  )
}
