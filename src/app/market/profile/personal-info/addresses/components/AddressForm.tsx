"use client";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import useFetchCitiesFromUf from "@/hooks/useFetchCitiesFromUf";
import useFetchCep from "@/hooks/useFetchCep";
import useFetchUfs from "@/hooks/useFetchUfs";
import { AddressFormValues, addressSchema } from "@/lib/schemas";
import { IbgeApiCity, IbgeApiUf } from "@/types/types";
import { formatCep, formatPhoneNumber } from "@/utils/functions";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Pen, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

interface IAddressFormProps {
	defaultValues?: AddressFormValues;
	onSubmit: (data: AddressFormValues) => void;
	isEditing?: boolean;
	onFormDismiss: () => void;
}

export default function AddressForm({
	defaultValues = {
		cep: "",
		uf: "",
		city: "",
		street: "",
		number: "",
		complement: "",
		alias: "",
		addressee: "",
		phone_number_addressee: "",
		referencePoint: ""
	},
	onSubmit,
	isEditing = false,
	onFormDismiss,
}: IAddressFormProps) {
	const [selectedUf, setSelectedUf] = useState(defaultValues.uf);
	const [pendingCityFromCep, setPendingCityFromCep] = useState<string | null>(null);

const [ufs] = useFetchUfs();

	const [cities, isLoadingCities] = useFetchCitiesFromUf(selectedUf);

	const form = useForm<AddressFormValues>({
		resolver: zodResolver(addressSchema),
		defaultValues: defaultValues,
	});

	const buttonProps = {
		isEditing: {
			defaultText: "Editar",
			loadingText: "Editando",
			icon: <Pen size={18} />,
		},
		isCreating: {
			defaultText: "Cadastrar",
			loadingText: "Cadastrando",
			icon: <Check size={16} />,
		},
	};

	function getButtonProps() {
		return isEditing ? buttonProps["isEditing"] : buttonProps["isCreating"];
	}

	// Auto-preenchimento por CEP (ViaCEP)
	const cepValue = form.watch("cep");
	const [cepData, isLoadingCep, cepQueryError] = useFetchCep(cepValue);
	useEffect(() => {

		if (cepQueryError) {
			toast.error("Erro ao consultar CEP. Tente novamente em alguns instantes.");
			return;
		}

		if (!cepData) return;

		if (cepData.erro) {
			toast.error("CEP não encontrado. Verifique se o CEP está correto e tente novamente.");
			return;
		}


		if (cepData.uf) {
			form.setValue("uf", cepData.uf, { shouldDirty: true });
			setSelectedUf(cepData.uf);
		}
		if (cepData.logradouro) {
			form.setValue("street", cepData.logradouro, { shouldDirty: true });
		}
		if (cepData.localidade) {
			setPendingCityFromCep(cepData.localidade);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cepValue, cepData, cepQueryError]);

	useEffect(() => {
		if (pendingCityFromCep && cities && cities.length > 0 && !isLoadingCities) {
			const foundCity = cities.find((c: IbgeApiCity) => c.nome === pendingCityFromCep);
			if (foundCity) {
				form.setValue("city", foundCity.nome, { shouldDirty: true, shouldValidate: true });
			}
			setPendingCityFromCep(null);
		}
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cities, isLoadingCities, pendingCityFromCep]);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="w-full max-w-4xl bg-white rounded-lg border border-border shadow p-6 md:p-10 space-y-6 text-foreground mx-auto"
			>
				{/* Nome do endereço */}
				<FormField
					control={form.control}
					name="alias"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Nome do endereço <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Fazenda da minha família"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* CEP */}
				<FormField
					control={form.control}
					name="cep"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								CEP <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										{...field}
							placeholder={isLoadingCep ? "Buscando CEP..." : "00000-000"}
										value={formatCep(field.value)}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, "");
											field.onChange(val);
										}}
										disabled={form.formState.isSubmitting}
									/>
						{isLoadingCep && (
										<div className="absolute right-3 top-1/2 transform -translate-y-1/2">
							<Loader2 className="h-4 w-4 animate-spin text-primary" />
										</div>
									)}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Estado */}
				<FormField
					control={form.control}
					name="uf"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Estado <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Select
									onValueChange={(v) => {
										form.setValue("uf", v);
										form.setValue("city", "");
										setSelectedUf(v);
									}}
									value={field.value}
										disabled={isLoadingCep || form.formState.isSubmitting}
								>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Selecione" />
									</SelectTrigger>
									<SelectContent>
										{ufs?.map((uf: IbgeApiUf) => (
											<SelectItem key={uf.sigla} value={uf.sigla}>
												{uf.nome}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Cidade */}
				<FormField
					control={form.control}
					name="city"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Cidade <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<div className="relative">
									<Select
										onValueChange={field.onChange}
										value={field.value}
										disabled={!selectedUf || isLoadingCities || isLoadingCep || form.formState.isSubmitting}
									>
										<SelectTrigger className="w-full">
											<SelectValue placeholder={isLoadingCities ? "Carregando cidades..." : "Selecione"} />
										</SelectTrigger>
										<SelectContent>
											{cities?.map((c: IbgeApiCity) => (
												<SelectItem key={c.id} value={c.nome}>
													{c.nome}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									{isLoadingCities && (
										<div className="absolute right-8 top-1/2 transform -translate-y-1/2">
											<Loader2 className="h-4 w-4 animate-spin text-primary" />
										</div>
									)}
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Rua*/}
				<div className="gap-4">
					<FormField
						control={form.control}
						name="street"
						render={({ field }) => (
							<FormItem className="col-span-2">
								<FormLabel>
									Rua/Avenida <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										placeholder="Rua das Flores"
										disabled={form.formState.isSubmitting || isLoadingCep}
										className="w-full"
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				</div>

				{/* Número */}
				<FormField
					control={form.control}
					name="number"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Número <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="32"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Complemento */}
				<FormField
					control={form.control}
					name="complement"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Complemento <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Projeto N10"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Ponto de referência */}
				<FormField
					control={form.control}
					name="referencePoint"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Ponto de referência</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="Ao lado da Fazenda Boa Vista"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Nome do destinatário */}
				<FormField
					control={form.control}
					name="addressee"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Nome do Responsável <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									placeholder="João Silva"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Telefone */}
				<FormField
					control={form.control}
					name="phone_number_addressee"
					render={({ field }) => (
						<FormItem>
							<FormLabel>
								Telefone para contato <span className="text-red-500">*</span>
							</FormLabel>
							<FormControl>
								<Input
									{...field}
									value={formatPhoneNumber(field.value)}
									onChange={(e) => {
										const val = e.target.value.replace(/\D/g, "");
										field.onChange(val);
									}}
									placeholder="(99) 99999-9999"
									disabled={form.formState.isSubmitting}
									className="w-full"
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				{/* Botões */}
				<div className="flex flex-col sm:flex-row gap-4 pt-4">
					<Button
						type="submit"
						disabled={form.formState.isSubmitting}
						className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-sucess text-white h-12"
					>
						{form.formState.isSubmitting ? (
							<Loader2 size={16} className="animate-spin" />
						) : (
							getButtonProps().icon
						)}
						{form.formState.isSubmitting
							? getButtonProps().loadingText
							: getButtonProps().defaultText}
					</Button>
					<Button
						type="button"
						disabled={form.formState.isSubmitting}
						onClick={onFormDismiss}
						className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white h-12"
					>
						<XCircle size={16} />
						Cancelar
					</Button>
				</div>
			</form>
		</Form>
	);
}