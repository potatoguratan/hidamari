import { CustomerDetail } from "@/components/features/customers/CustomerDetail"

type Props = { params: Promise<{ id: string }> }

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params
  return <CustomerDetail id={id} />
}
