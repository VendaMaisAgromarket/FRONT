import { getAllSellingUnits } from '@/actions/sellingUnit';
import PriceRecommendation from '@/components/price-recommendation';
import {
	AlertDialogHeader,
	AlertDialogFooter,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
	FormField,
	FormItem,
	FormLabel,
	FormControl,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CreateProductSchemaType } from '@/lib/schemas';
import { inputMoneyMask } from '@/utils/functions';
import {
	AlertDialog,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogCancel,
	AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import { CirclePlus, HelpCircle, Trash2 } from 'lucide-react';
import { ChangeEvent, useEffect, useState } from 'react';
import {
	ControllerRenderProps,
	useFieldArray,
	UseFormReturn,
} from 'react-hook-form';

export default function CreateProductSecondPageForm({
	form,
}: {
	form: UseFormReturn<CreateProductSchemaType>;
}) {
	const [sellingUnits, setSellingUnits] = useState<
		{ id: string; unit: string; title: string }[]
	>([]);

	const {
		fields: sellingUnitFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: 'sellingUnits',
	});

	const productName = form.watch('name');

	async function getSellingUnits() {
		const res = await getAllSellingUnits();
		setSellingUnits(res);
	}

	function handleSellingUnitValue(
		field: ControllerRenderProps<
			CreateProductSchemaType,
			`sellingUnits.${number}.minPrice`
		>,
		event: ChangeEvent<HTMLInputElement>
	) {
		event.target.value = inputMoneyMask(event.target.value);
		field.onChange(event);
	}

	useEffect(() => {
		getSellingUnits();
	}, []);

	return (
		<>
			{sellingUnitFields.length ? (
				<ul className="space-y-4">
					{sellingUnitFields.map((field, index) => {
						return (
							<li
								key={field.id}
								className="relative bg-white px-4 pt-16 pb-14 rounded-md"
							>
								<AlertDialog>
									<AlertDialogTrigger className="flex absolute right-4 top-5 text-red-500 gap-2 cursor-pointer">
										<Trash2 />
										Remover
									</AlertDialogTrigger>

									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>
												Você tem certeza disso?
											</AlertDialogTitle>

											<AlertDialogDescription>
												Quando removida, a informação não pode mais ser
												recuperada.
											</AlertDialogDescription>
										</AlertDialogHeader>

										<AlertDialogFooter>
											<AlertDialogCancel>Cancelar</AlertDialogCancel>

											<AlertDialogAction
												onClick={() => remove(index)}
												className="bg-red-500 hover:bg-red-600"
											>
												Remover
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>

								<div className="flex flex-col gap-6 items-start">
									{/* Unidade */}
									<FormField
										control={form.control}
										name={`sellingUnits.${index}.unitId`}
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel className="flex items-center gap-1">
													Unidade <span className="text-red-500">*</span>
													<Tooltip>
														<TooltipTrigger>
															<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
														</TooltipTrigger>

														<TooltipContent side="top" align="center">
															Selecione a unidade de venda (ex: kg, cento,
															caixa).
														</TooltipContent>
													</Tooltip>
												</FormLabel>

												<FormControl>
													<Select
														onValueChange={(v) => {
															form.setValue(
																`sellingUnits.${index}.acronym`,
																sellingUnits.find((s) => s.id === v)!
																	.unit
															);
															field.onChange(v);
														}}
														value={field.value}
													>
														<SelectTrigger className="w-full">
															<SelectValue placeholder="Selecione" />
														</SelectTrigger>

														<SelectContent>
															{sellingUnits.map((u) => (
																<SelectItem key={u.id} value={u.id}>
																	{u.title}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</FormControl>

												<FormMessage />
											</FormItem>
										)}
									/>

									{/* Valor mínimo */}
									<FormField
										control={form.control}
										name={`sellingUnits.${index}.minPrice`}
										render={({ field }) => (
											<FormItem className="w-full">
												<FormLabel className="flex items-center gap-1">
													Preço mínimo
													<span className="text-red-500">*</span>
													<Tooltip>
														<TooltipTrigger>
															<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
														</TooltipTrigger>

														<TooltipContent side="top" align="center">
															Defina o preço mínimo por unidade de venda (ex:
															5,50 para R$ 5,50).
														</TooltipContent>
													</Tooltip>
												</FormLabel>

												<FormControl>
													<Input
														placeholder="Digite o valor mínimo do produto"
														value={field.value}
														onChange={(e) => handleSellingUnitValue(field, e)}
														className="w-full"
													/>
												</FormControl>

												<FormMessage />

												<PriceRecommendation productName={productName} />
											</FormItem>
										)}
									/>
								</div>
							</li>
						);
					})}
				</ul>
			) : (
				<>
					{form.formState.errors.sellingUnits ? (
						<p className="text-center text-red-500 mt-4">
							Erro: {form.formState.errors.sellingUnits.message}
						</p>
					) : (
						<p className="text-center text-zinc-400 mt-4">
							Por favor insira uma unidade de venda
						</p>
					)}
				</>
			)}

			<Button
				type="button"
				className="w-full"
				onClick={() => append({ unitId: '', minPrice: '', acronym: '' })}
			>
				<CirclePlus />
				Adicionar nova unidade
			</Button>
		</>
	);
}
