import { createCertificationProxy } from "@/lib/certificationProxy";

// Público: GET /badge/:userId
const proxy = createCertificationProxy(
	"farm",
	(method, path) => method === "GET" && path[0] === "badge" && path.length === 2
);

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
