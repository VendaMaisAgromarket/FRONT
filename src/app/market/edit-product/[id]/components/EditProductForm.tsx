'use client';

import { getProductDetails, updateProduct } from '@/actions/product';
import { getAllSellingUnits } from '@/actions/sellingUnit';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { zodResolver } from '@hookform/resolvers/zod';
import {
	CalendarIcon,
	Check,
	ChevronDown,
	ChevronUp,
	CirclePlus,
	CircleX,
	HelpCircle,
	PlusCircle,
	Trash,
	Trash2,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import { ControllerRenderProps, useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import PriceRecommendation from '@/components/price-recommendation';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { createProductSchema } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { fruitsCategories, fruitVarieties } from '@/utils/data';
import { inputMoneyMask, moneyMask, removeMoneyMask } from '@/utils/functions';
import { format, isBefore, startOfDay } from 'date-fns';

type CreateProductValues = z.infer<typeof createProductSchema>;

export default function EditProductForm({ productId }: { productId: string }) {
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [selectedImageIndex, setSelectedImageIndex] = useState(0);
	const [previewImages, setPreviewImages] = useState<string[]>([]);
	const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]); // URLs antigas do S3
	const [newImageFiles, setNewImageFiles] = useState<File[]>([]); // Arquivos novos
	const fileInputRef = useRef<HTMLInputElement>(null);
	const [openGeneral, setOpenGeneral] = useState(true);
	const [openPrices, setOpenPrices] = useState(true);
	const [sellingUnits, setSellingUnits] = useState<
		{ id: string; unit: string; title: string }[]
	>([]);
	const [isMobile, setIsMobile] = useState(false);
	const form = useForm<CreateProductValues>({
		resolver: zodResolver(createProductSchema),
		defaultValues: {
			name: '',
			variety: '',
			category: '',
			amount: '',
			description: '',
			sellingUnits: [],
			images: [],
			isNegotiable: false,
		},
	});
	const {
		fields: sellingUnitFields,
		append,
		remove,
	} = useFieldArray({
		control: form.control,
		name: 'sellingUnits',
	});
	const {
		watch,
		handleSubmit,
		formState: { isSubmitting },
	} = form;
	const { control: controlForm } = form;
	const productName = watch('name');

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 520);
		};

		handleResize();
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	useEffect(() => {
		async function fetchUnits() {
			try {
				const res = await getAllSellingUnits();
				setSellingUnits(res);
			} catch (error) {
				console.error('Erro ao buscar unidades de venda: ', error);

				toast.error(
					'Erro ao buscar unidades de venda, por favor tente novamente.'
				);
			}
		}
		async function fetchData() {
			setLoading(true);
			try {
				const data = await getProductDetails(productId, true);

				if (!data) throw new Error();

				// Carregar imagens existentes do produto
				const existingImages = Array.isArray(data.images_Path) ? data.images_Path : [];
				setExistingImageUrls(existingImages);
				setPreviewImages(existingImages);

				const newDefaultValues = {
					name: data.name,
					category: data.category,
					amount: data.stock.toString(),
					description: data.description,
					sellingUnits: data.sellingUnitProduct.map(
						(su: {
							minPrice: number;
							unitId: number;
							unit: { unit: string };
						}) => {
							return {
								minPrice: moneyMask(su.minPrice),
								unitId: su.unitId.toString(),
								acronym: su.unit.unit,
							};
						}
					),
					images: [new File([''], 'placeholder.txt')],
					isNegotiable: data.isNegotiable,
					harvestAt: new Date(data.harvestAt),
					createdAt: data.createdAt,
					variety: data.variety,
				};

				form.reset(newDefaultValues);
			} catch (err) {
				console.error(err);

				toast.error('Não foi possível encontrar o produto.');
				router.back();
			} finally {
				setLoading(false);
			}
		}

		fetchData();
		fetchUnits();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [productId]);

	if (loading) return <div className="text-center py-20">Carregando...</div>;

	const handleThumbnailClick = (idx: number) => setSelectedImageIndex(idx);
	//   const handleAddPhotos = () => fileInputRef.current?.click();
	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		if (!files?.length) return;

		const existingCount = previewImages.length;
		const availableSlots = 10 - existingCount;

		if (availableSlots <= 0) {
			toast.warning('Você pode enviar no máximo 10 imagens.');
			return;
		}

		const selectedFiles = Array.from(files).slice(0, availableSlots);

		// Guardar os arquivos novos
		setNewImageFiles((prev) => [...prev, ...selectedFiles]);

		const fileReaders = selectedFiles.map(
			(file) =>
				new Promise<string>((resolve, reject) => {
					const reader = new FileReader();
					reader.onload = () => resolve(reader.result as string);
					reader.onerror = () => reject('Erro ao carregar imagem');
					reader.readAsDataURL(file);
				})
		);

		Promise.all(fileReaders)
			.then((images) => {
				setPreviewImages((prev) => [...prev, ...images]);
				setSelectedImageIndex((prev) =>
					prev === 0 ? 0 : Math.min(prev + images.length, 9)
				);
			})
			.catch((err) => {
				console.error(err);
				toast.error('Erro ao processar imagens.');
			});
	};

	const handleRemoveImage = () => {
		const removedImageUrl = previewImages[selectedImageIndex];

		// Verificar se é uma URL existente (do S3) ou um novo arquivo (base64)
		const isExistingImage = existingImageUrls.includes(removedImageUrl);

		if (isExistingImage) {
			// Remover da lista de URLs existentes
			setExistingImageUrls((prev) =>
				prev.filter((url) => url !== removedImageUrl)
			);
		} else {
			// É uma nova imagem (base64) - precisa remover o arquivo correspondente
			const newImageIndex = previewImages
				.slice(0, selectedImageIndex)
				.filter((url) => !existingImageUrls.includes(url)).length;

			setNewImageFiles((prev) => {
				const updated = [...prev];
				updated.splice(newImageIndex, 1);
				return updated;
			});
		}

		// Remover do preview
		setPreviewImages((prev) => {
			const updated = [...prev];
			updated.splice(selectedImageIndex, 1);
			return updated;
		});

		setSelectedImageIndex(0);
	};

	const handleCancel = () => router.back();

	const handleSellingUnitValue = (
		field: ControllerRenderProps<
			CreateProductValues,
			`sellingUnits.${number}.minPrice`
		>,
		event: ChangeEvent<HTMLInputElement>
	) => {
		event.target.value = inputMoneyMask(event.target.value);
		field.onChange(event);
	};

	const onSubmit = async (data: CreateProductValues) => {
		try {
			// Criar FormData para enviar arquivos + dados
			const formData = new FormData();

			// Adicionar campos simples
			formData.append('name', data.name);
			formData.append('variety', data.variety);
			formData.append('category', data.category);
			formData.append('stock', String(Number(String(data.amount).replace(',', '.'))));
			formData.append('description', data.description);
			formData.append('harvestAt', data.harvestAt.toISOString());
			formData.append('isNegotiable', String(data.isNegotiable));

			// Adicionar unidades de venda como JSON
			const sellingUnitsPayload = data.sellingUnits.map((u) => ({
				unitId: u.unitId, // Mantém como string (esperado pelo Prisma)
				minPrice: removeMoneyMask(u.minPrice),
			}));
			formData.append('sellingUnitProduct', JSON.stringify(sellingUnitsPayload));

			// Adicionar URLs existentes (imagens antigas que devem ser mantidas)
			formData.append('existingImages', JSON.stringify(existingImageUrls));

			// Adicionar novos arquivos de imagem
			newImageFiles.forEach((file) => {
				formData.append('images', file);
			});

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const res = await updateProduct(productId, formData as any);

			if (!res.success) {
				toast.error(res.message);
				return;
			}
			toast.success('Produto editado com sucesso!');
			router.push('/market/myproducts');
		} catch (error) {
			console.error('Erro ao atualizar produto:', error);
			toast.error('Erro ao atualizar o produto. Tente novamente.');
		}
	};

	const getFirstSellingUnitData = () => {
		const value = watch(`sellingUnits.${0}.minPrice`);
		const acronym = watch(`sellingUnits.${0}.acronym`);

		if (value && acronym) {
			return (
				<div className="flex items-baseline mt-1">
					<span className="text-[28px] font-semibold text-black">{value}</span>
					<span className="text-[16px] font-semibold text-primary ml-1">
						/{acronym}
					</span>
				</div>
			);
		}

		return (
			<div className="flex items-baseline mt-1">
				<span className="text-[28px] font-semibold text-black">R$ 0,00</span>
				<span className="text-[16px] font-semibold text-primary ml-1">/un</span>
			</div>
		);
	};

	return (
		<Form {...form}>
			<div className="mt-4">
				<h1 className="text-[28px] font-bold text-black">{productName}</h1>
				<p className="text-[16px] text-black">Edite os dados do seu produto.</p>
			</div>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="py-8 px-4 sm:px-6 lg:px-8 max-w-[900px] mx-auto"
			>
				<div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
					<div className="flex flex-col md:flex-row gap-4">
						<div className="relative flex flex-row lg:flex-col gap-2 overflow-visible order-2 md:order-1">
							<Carousel
								opts={{ align: 'start' }}
								orientation={isMobile ? 'horizontal' : 'vertical'}
								className={
									isMobile ? 'w-full' : 'min-[520px]:h-52 min-[520px]:w-14'
								}
							>
								{previewImages.length > 0 && (
									<>
										<CarouselContent className="my-2 min-[520px]:h-52 min-[520px]:-mt-4">
											{previewImages.map((img, idx) => (
												<CarouselItem
													key={idx}
													className="basis-1/5 min-[520px]:basis-1/4 min-[520px]:pt-5"
												>
													<li
														className={`relative size-12 mx-auto list-none ${selectedImageIndex === idx
															? 'ring-2 rounded-md ring-primary transition-all duration-300'
															: ''
															}`}
													>
														<button
															onClick={() => handleThumbnailClick(idx)}
															className="cursor-pointer"
															type="button"
														>
															<Image
																src={img}
																alt={`Thumbnail ${idx + 1}`}
																fill
																className="object-cover"
															/>
														</button>
													</li>
												</CarouselItem>
											))}
										</CarouselContent>
										<CarouselPrevious
											className={`z-10 sm:size-7 ${isMobile
												? 'absolute -left-[20px] top-1/2 -translate-y-1/2'
												: 'absolute left-1/2 -translate-x-1/2 -top-4'
												}`}
										/>

										<CarouselNext
											className={`z-10 sm:size-7 ${isMobile
												? 'absolute -right-[20px] top-1/2 -translate-y-1/2'
												: 'absolute left-1/2 -translate-x-1/2 -bottom-1'
												}`}
										/>
									</>
								)}
							</Carousel>
						</div>

						<div className="flex flex-col items-center gap-4 order-1 md:order-2">
							<div className="relative w-[350px] max-w-[350px] aspect-square rounded-[8px] border-2 border-primary overflow-hidden">
								{previewImages[selectedImageIndex] && (
									<Image
										src={previewImages[selectedImageIndex]}
										alt="Preview"
										fill
										className="object-cover"
									/>
								)}
								<button
									type="button"
									onClick={handleRemoveImage}
									className="absolute top-2 right-2 bg-[#D10000] hover:bg-[#B00000] text-white rounded-[4px] px-2 h-[28px] flex items-center gap-1"
								>
									<Trash size={16} />
									<span className="text-[14px]">Remover</span>
								</button>
							</div>
							<button
								type="button"
								onClick={() => fileInputRef.current?.click()}
								className="w-full max-w-[350px] h-[40px] bg-primary hover:bg-sucess text-white rounded-[4px] flex items-center justify-center gap-2 shadow-sm"
							>
								<PlusCircle size={16} />
								<span className="text-[16px] font-medium">Adicionar fotos</span>
							</button>
							<input
								type="file"
								accept="image/*"
								multiple
								className="hidden"
								ref={fileInputRef}
								onChange={handleFileChange}
							/>
						</div>
					</div>

					<div className="flex-1 pt-2 hidden md:block">
						<h1 className="text-[28px] font-bold text-black">{productName}</h1>
						{getFirstSellingUnitData()}
					</div>
				</div>

				<div className="mt-8 border border-[#E2E2E5] rounded-[8px] bg-white">
					<div
						className="flex justify-between items-center px-4 py-3 cursor-pointer"
						onClick={() => setOpenGeneral(!openGeneral)}
					>
						<span className="text-[14px] font-medium text-[#333333]">
							Informações gerais
						</span>
						{openGeneral ? (
							<ChevronUp size={16} color="#666666" />
						) : (
							<ChevronDown size={16} color="#666666" />
						)}
					</div>
					{openGeneral && (
						<div className="px-4 pb-4">
							<div className="mt-2 space-y-4">
								<FormField
									control={controlForm}
									name="name"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1">
												Produto<span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Insira o nome completo do produto.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Digite o nome do produto"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="variety"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1">
												Variedade <span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Selecione a variedade da fruta (ex: Palmer, Tommy,
														etc.).
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Select
													onValueChange={field.onChange}
													value={field.value}
													disabled={!productName}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Selecione a variedade da fruta" />
													</SelectTrigger>
													<SelectContent>
														{(() => {
															const varieties =
																fruitVarieties[
																productName.toLowerCase() as keyof typeof fruitVarieties
																] || [];

															return (
																<>
																	{varieties.map((variety) => (
																		<SelectItem
																			key={variety.value}
																			value={variety.value}
																		>
																			{variety.label}
																		</SelectItem>
																	))}
																	<SelectItem value="Outra">Outra</SelectItem>
																</>
															);
														})()}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={form.control}
									name="category"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1">
												Categoria<span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Selecione a categoria que melhor descreve seu
														produto.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Select
													onValueChange={field.onChange}
													value={field.value}
												>
													<SelectTrigger className="w-full">
														<SelectValue placeholder="Selecione a categoria do seu produto" />
													</SelectTrigger>
													<SelectContent>
														{fruitsCategories.map((c) => (
															<SelectItem key={c.value} value={c.value}>
																{c.label}
															</SelectItem>
														))}
													</SelectContent>
												</Select>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Data de colheita */}
								<FormField
									control={controlForm}
									name="harvestAt"
									render={({ field }) => (
										<FormItem className="flex flex-col">
											<FormLabel className="flex items-center gap-1">
												Data de colheita<span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Selecione a data estimada para a colheita.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<button
															type="button"
															className={cn(
																'pl-3 text-left font-normal bg-transparent w-full h-10 rounded-md border border-input px-3 py-2 text-sm',
																!field.value && 'text-muted-foreground'
															)}
														>
															{field.value instanceof Date ? (
																format(field.value, 'dd/MM/yy')
															) : (
																<span>Selecione uma data</span>
															)}
															<CalendarIcon className="ml-auto h-4 w-4 opacity-50 inline-block float-right" />
														</button>
													</FormControl>
												</PopoverTrigger>
												<PopoverContent className="w-auto p-0" align="start">
													<Calendar
														mode="single"
														selected={field.value}
														onSelect={field.onChange}
														disabled={(date) =>
															isBefore(startOfDay(date), startOfDay(new Date()))
														}
														captionLayout="dropdown"
													/>
												</PopoverContent>
											</Popover>
											<FormMessage />
										</FormItem>
									)}
								/>

								{/* Aceita negociação */}
								<FormField
									control={controlForm}
									name="isNegotiable"
									render={({ field }) => (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
											<FormLabel className="flex items-center gap-1">
												Aceita negociação?
												<span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Selecione se deseja aceitar propostas de valor.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Switch
													checked={!!field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									)}
								/>

								<FormField
									control={controlForm}
									name="amount"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1">
												Estoque disponível (kg)
												<span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Informe a quantidade em quilos disponível.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Input
													placeholder="Ex.: 12,5"
													value={field.value}
													onChange={(e) => {
														const v = e.target.value;
														if (/^[0-9]*([.,][0-9]*)?$/.test(v) || !v) {
															field.onChange(v);
														}
													}}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>

								<FormField
									control={controlForm}
									name="description"
									render={({ field }) => (
										<FormItem>
											<FormLabel className="flex items-center gap-1">
												Descrição <span className="text-red-500">*</span>
												<Tooltip>
													<TooltipTrigger>
														<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
													</TooltipTrigger>
													<TooltipContent side="top" align="center">
														Ex.: Manga Palmer, calibre 14, grau Brix 13,5, etc.
													</TooltipContent>
												</Tooltip>
											</FormLabel>
											<FormControl>
												<Textarea
													placeholder="Detalhes do produto"
													className="resize-none min-h-32"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
						</div>
					)}
				</div>

				<div className="mt-8 border border-[#E2E2E5] rounded-[8px] bg-white">
					<div
						className="flex justify-between items-center px-4 py-3 cursor-pointer"
						onClick={() => setOpenPrices(!openPrices)}
					>
						<span className="text-[14px] font-medium text-[#333333]">
							Preços
						</span>
						{openPrices ? (
							<ChevronUp size={16} color="#666666" />
						) : (
							<ChevronDown size={16} color="#666666" />
						)}
					</div>
					{openPrices && (
						<div className="px-4 pb-4">
							<Button
								type="button"
								className="w-full"
								onClick={() =>
									append({ unitId: '', minPrice: '', acronym: '' })
								}
							>
								<CirclePlus />
								Adicionar nova unidade
							</Button>

							{sellingUnitFields.length ? (
								<ul className="mt-4 space-y-4">
									{sellingUnitFields.map((field, index) => {
										return (
											<li
												key={field.id}
												className="relative bg-white border border-neutral-200 px-4 pt-16 pb-14 rounded-md"
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
													<FormField
														control={form.control}
														name={`sellingUnits.${index}.unitId`}
														render={({ field }) => (
															<FormItem className="w-full">
																<FormLabel className="flex items-center gap-1">
																	Unidade{' '}
																	<span className="text-red-500">*</span>
																	<Tooltip>
																		<TooltipTrigger>
																			<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
																		</TooltipTrigger>
																		<TooltipContent side="top" align="center">
																			Selecione a unidade de venda (ex: kg,
																			cento, caixa).
																		</TooltipContent>
																	</Tooltip>
																</FormLabel>
																<FormControl>
																	<Select
																		onValueChange={(v) => {
																			const selectedUnit = sellingUnits.find(
																				(s) => s.id === v
																			);
																			if (selectedUnit) {
																				form.setValue(
																					`sellingUnits.${index}.acronym`,
																					selectedUnit.unit
																				);
																			}
																			field.onChange(v);
																		}}
																		value={field.value}
																	>
																		<SelectTrigger className="w-full">
																			<SelectValue placeholder="Selecione" />
																		</SelectTrigger>
																		<SelectContent>
																			{sellingUnits.map((u) => (
																				<SelectItem
																					key={u.id}
																					value={u.id}
																				>
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
																			Defina o preço mínimo por unidade de venda
																			(ex: 5,50 para R$ 5,50).
																		</TooltipContent>
																	</Tooltip>
																</FormLabel>
																<FormControl>
																	<Input
																		placeholder="Digite o valor mínimo do produto"
																		value={field.value}
																		onChange={(e) =>
																			handleSellingUnitValue(field, e)
																		}
																		className="w-full"
																	/>
																</FormControl>
																<FormMessage />
																<PriceRecommendation
																	productName={productName}
																/>
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
											Erro: {form.formState.errors.sellingUnits?.root?.message}
										</p>
									) : (
										<p className="text-center text-zinc-400 mt-4">
											Por favor insira uma unidade de venda
										</p>
									)}
								</>
							)}
						</div>
					)}
				</div>

				<div className="mt-8 flex flex-col sm:flex-row justify-between gap-4 pb-8">
					<button
						type="button"
						onClick={handleCancel}
						className="w-full sm:w-[300px] h-[40px] bg-[#D10000] hover:bg-[#B00000] text-white rounded-[4px] text-[16px] font-semibold flex items-center justify-center gap-2 shadow-sm"
					>
						<CircleX size={16} />
						<span>Cancelar</span>
					</button>
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full sm:w-[300px] h-[40px] bg-primary hover:bg-sucess text-white rounded-[4px] text-[16px] font-semibold flex items-center justify-center gap-2 shadow-sm"
					>
						<Check size={16} />
						<span>Finalizar</span>
					</button>
				</div>
			</form>
		</Form>
	);
}
