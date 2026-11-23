import { createCertificationProxy } from "@/lib/certificationProxy";

// Público: GET /product/:productId/badge
const proxy = createCertificationProxy(
	"harvest",
	(method, path) =>
		method === "GET" && path.length === 3 && path[0] === "product" && path[2] === "badge"
);

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
