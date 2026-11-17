import { Suspense } from "react";
import FarmCertificationsClient from "./components/FarmCertificationsClient";

export default function FarmCertificationsPage() {
	return (
		<Suspense>
			<FarmCertificationsClient />
		</Suspense>
	);
}
