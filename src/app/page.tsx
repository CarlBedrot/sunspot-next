'use client'

import dynamic from 'next/dynamic'

const SunspotMap = dynamic(() => import('@/components/SunspotMap').then((m) => m.SunspotMap), {
  ssr: false,
})

export default function Home() {
  return <SunspotMap />
}
