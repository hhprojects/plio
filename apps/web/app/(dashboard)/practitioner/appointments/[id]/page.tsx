import { AppointmentDetailClient } from './page-client'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AppointmentDetailPage({ params }: Props) {
  const { id } = await params
  return <AppointmentDetailClient appointmentId={id} />
}
