import { requireRole } from '@/lib/auth/module-guard'
import { ScanPageClient } from './page-client'

export default async function ScanPage() {
  await requireRole(['admin', 'super_admin'])
  return <ScanPageClient />
}
