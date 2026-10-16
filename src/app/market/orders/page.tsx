import OrdersClient from "./components/OrdersClient";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ saleId?: string }>;
}) {
  const { saleId } = await searchParams;
  return <OrdersClient focusSaleId={saleId} />;
}
