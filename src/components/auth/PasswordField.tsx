"use client";

import { Input } from "@/components/ui/input";
import { Eye, EyeOff } from "lucide-react";
import { ComponentProps, useState } from "react";

/** Input de senha com botão mostrar/ocultar; repassa id/aria do FormControl para o input. */
export default function PasswordField(props: ComponentProps<typeof Input>) {
	const [isShown, setIsShown] = useState(false);

	return (
		<div className="relative">
			<Input
				{...props}
				type={isShown ? "text" : "password"}
				className="h-12 pr-10"
			/>
			<button
				type="button"
				onClick={() => setIsShown(!isShown)}
				className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
				aria-label={isShown ? "Ocultar senha" : "Mostrar senha"}
			>
				{isShown ? <EyeOff size={20} /> : <Eye size={20} />}
			</button>
		</div>
	);
}
