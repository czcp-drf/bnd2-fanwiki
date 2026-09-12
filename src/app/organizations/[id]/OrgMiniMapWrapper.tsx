'use client'

import dynamic from 'next/dynamic'
import type { OrgMapData } from './OrgMiniMap'

const OrgMiniMap = dynamic(() => import('./OrgMiniMap'), { ssr: false })

export default function OrgMiniMapWrapper({ org }: { org: OrgMapData }) {
  return <OrgMiniMap org={org} />
}
