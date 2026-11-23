import { Suspense } from "react";
import HarvestCertificationsClient from "./components/HarvestCertificationsClient";

// Destino dos e-mails e notificações de safra enviados ao dono.
export default function HarvestCertificationsPage() {
	return (
		<Suspense>
			<HarvestCertificationsClient />
		</Suspense>
	);
}
