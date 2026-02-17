import { getTenantBySlug, getPublicServices, getPublicPractitioners } from './actions'
import { BookingPageClient } from './page-client'
import { notFound } from 'next/navigation'

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const tenant = await getTenantBySlug(slug)
  if (!tenant.data) notFound()

  const [services, practitioners] = await Promise.all([
    getPublicServices(tenant.data.id),
    getPublicPractitioners(tenant.data.id),
  ])

  return (
    <BookingPageClient
      tenant={tenant.data}
      services={services.data}
      practitioners={practitioners.data}
    />
  )
}
