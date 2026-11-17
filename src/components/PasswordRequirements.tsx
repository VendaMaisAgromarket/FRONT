import { Check } from "lucide-react";

export default function PasswordRequirements({ password }: { password: string }) {
	const items = [
		{ label: "Senha com no mínimo 8 caracteres", met: password.length >= 8 },
		{ label: "Ao menos uma letra maiúscula (A-Z)", met: /[A-Z]/.test(password) },
		{ label: "Ao menos uma letra minúscula (a-z)", met: /[a-z]/.test(password) },
		{ label: "Números (0-9)", met: /[0-9]/.test(password) },
		{ label: "Caracteres especiais ($, %, @, …)", met: /[^A-Za-z0-9]/.test(password) },
	];

	return (
		<ul className="mt-2 space-y-1 text-xs">
			{items.map((item) => (
				<li
					key={item.label}
					className={`flex items-center gap-1.5 transition-colors ${item.met ? "text-green-600" : "text-gray-900"}`}
				>
					{item.met
						? <Check className="h-3 w-3 shrink-0" />
						: <span className="h-3 w-3 shrink-0 flex items-center justify-center text-[10px]">•</span>
					}
					{item.label}
				</li>
			))}
		</ul>
	);
}
