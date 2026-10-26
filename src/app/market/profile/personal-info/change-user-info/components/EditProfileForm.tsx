"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Pencil, XCircle } from "lucide-react";

const profileSchema = z.object({
	email: z.string().email("Informe um email válido"),
	phone: z.string().min(1, "Informe um telefone"),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

// Função para formatar o telefone enquanto o usuário digita
function formatPhone(number: string) {
	number = number.replace(/\D/g, "");
	number = number.slice(0, 11);

	if (number.length <= 10) {
		return number.replace(/^(\d{2})(\d{4})(\d{0,4})$/, "($1) $2-$3").trim();
	} else {
		return number.replace(/^(\d{2})(\d{5})(\d{0,4})$/, "($1) $2-$3").trim();
	}
}

interface InitialData {
	name: string;
	email: string;
	phone: string;
	ccir: string;
	cnpj: string;
	cpf: string;
	role: "cooperative" | "distributor-or-association" | 'farmer' |string;
}

interface Props {
	initialData: InitialData;
}

export default function EditProfileForm({ initialData }: Props) {
	const router = useRouter();

	const form = useForm<ProfileFormValues>({
		resolver: zodResolver(profileSchema),
		defaultValues: {
			email: initialData.email,
			phone: initialData.phone,
		},
		mode: "onBlur",
	});

	const onSubmit = async (values: ProfileFormValues) => {
		try {
			const res = await fetch("/api/user", {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email: values.email.trim(),
					phone: values.phone.trim(),
				}),
			});
			const data = await res.json();

			if (res.status === 401) {
				toast.error("Não autorizado. Faça login novamente.");
			} else if (!res.ok) {
				toast.error(data.error || "Erro ao salvar os dados.");
			} else {
				toast.success("Dados atualizados com sucesso!");
				setTimeout(() => router.push("/market/profile/personal-info"), 1000);
			}
		} catch {
			toast.error("Erro de rede ao salvar.");
		}
	};

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
				{/* Nome (apenas exibição) */}
				<div>
					<Label htmlFor="name" className="mb-2">
						Nome completo
					</Label>
					<Input
						id="name"
						disabled
						value={initialData.name}
						className="w-full disabled:bg-gray-100"
					/>
				</div>

				{/* Email com validação Zod + FormMessage */}
				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Email <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="text"
									placeholder="seu.email@dominio.com"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormDescription className="text-xs">
								Usaremos este e-mail para avisos sobre seus pedidos e para recuperação de senha.
							</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Telefone com formatPhone */}
				<FormField
					control={form.control}
					name="phone"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Telefone <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									type="text"
									placeholder="(00) 0 0000-0000"
									disabled={form.formState.isSubmitting}
									onChange={(e) => {
										const inputType = (e.nativeEvent as InputEvent).inputType;
										const raw = e.target.value;

										if (inputType === "deleteContentBackward") {
											field.onChange(raw);
											return;
										}

										field.onChange(formatPhone(raw));
									}}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<div>
					<Label htmlFor="ccir" className="mb-2">
						CCIR
					</Label>
					<Input
						id="ccir"
						disabled
						value={initialData.ccir}
						className="w-full disabled:bg-gray-100"
					/>
				</div>
				<div>
					<Label htmlFor="cnpj" className="mb-2">
						CNPJ
					</Label>
					<Input
						id="cnpj"
						disabled
						value={initialData.cnpj}
						className="w-full disabled:bg-gray-100"
					/>
				</div>

				{/* Botões */}
				<div className="flex flex-col sm:flex-row gap-4 pt-4">
					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						className="flex-1 flex items-center justify-center gap-2 text-gray-50 bg-primary hover:bg-success transition h-12 disabled:bg-gray-400 disabled:cursor-auto disabled:opacity-50"
					>
						{form.formState.isSubmitting ? (
							<>
								<Loader2 size={16} className="animate-spin" />
								Salvando…
							</>
						) : (
							<>
								<Pencil size={16} />
								Salvar
							</>
						)}
					</Button>

					<Button
						type="button"
						disabled={form.formState.isSubmitting}
						onClick={() => router.push("/market/profile/personal-info")}
						className="flex-1 flex items-center justify-center gap-2 text-gray-50 bg-red-500 hover:bg-red-600 transition h-12 disabled:bg-gray-400 disabled:cursor-auto disabled:opacity-50"
					>
						<XCircle size={16} />
						<span>Cancelar</span>
					</Button>
				</div>
			</form>
		</Form>
	);
}
