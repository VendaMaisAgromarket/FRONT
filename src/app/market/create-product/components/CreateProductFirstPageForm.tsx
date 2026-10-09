import {
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CreateProductSchemaType } from '@/lib/schemas';
import { cn } from '@/lib/utils';
import { fruitVarieties, fruitsCategories } from '@/utils/data';
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from '@radix-ui/react-popover';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from '@/components/ui/tooltip';
import { HelpCircle, CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay } from 'date-fns';
import { UseFormReturn } from 'react-hook-form';

export function CreateProductFirstPageForm({
	form,
}: {
	form: UseFormReturn<CreateProductSchemaType>;
}) {
	const productName = form.watch('name')?.trim().toLowerCase() || '';

	return (
		<>
			<FormField
				control={form.control}
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
							<Input placeholder="Digite o nome do produto" {...field} />
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
									Selecione a variedade da fruta (ex: Palmer, Tommy, etc.).
								</TooltipContent>
							</Tooltip>
						</FormLabel>

						<FormControl>
							<Select
								onValueChange={field.onChange}
								value={field.value}
								disabled={!productName} // desabilita se nenhum nome foi digitado
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
													<SelectItem key={variety.value} value={variety.value}>
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
									Selecione a categoria que melhor descreve seu produto.
								</TooltipContent>
							</Tooltip>
						</FormLabel>

						<FormControl>
							<Select onValueChange={field.onChange} value={field.value}>
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

			<FormField
				control={form.control}
				name="harvestAt"
				render={({ field }) => (
					<FormItem className="flex flex-col">
						<FormLabel>
							Data de colheita<span className="text-red-500">*</span>
							<Tooltip>
								<TooltipTrigger>
									<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
								</TooltipTrigger>

								<TooltipContent side="top" align="center">
									Selecione a data estimada para a realiação da colheita.
								</TooltipContent>
							</Tooltip>
						</FormLabel>

						<Popover>
							<PopoverTrigger asChild>
								<FormControl>
									<Button
										variant={'outline'}
										className={cn(
											'pl-3 text-left font-normal bg-transparent',
											!field.value && 'text-muted-foreground'
										)}
									>
										{field.value ? (
											format(field.value, 'dd/MM/yy')
										) : (
											<span>Selecione uma data</span>
										)}
										<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
									</Button>
								</FormControl>
							</PopoverTrigger>

							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={field.value}
									onSelect={field.onChange}
									disabled={(date) => date < startOfDay(new Date())}
									captionLayout="dropdown"
								/>
							</PopoverContent>
						</Popover>

						<FormMessage />
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
				name="isNegotiable"
				render={({ field }) => (
					<FormItem className="flex flex-row">
						<FormLabel>
							Aceita negociação?<span className="text-red-500">*</span>
							<Tooltip>
								<TooltipTrigger>
									<HelpCircle className="h-5 w-5 cursor-help text-primary self-center" />
								</TooltipTrigger>

								<TooltipContent side="top" align="center">
									Selecione se você deseja aceitar propostas de valor na compra
									do produto.
								</TooltipContent>
							</Tooltip>
						</FormLabel>

						<FormControl>
							<Switch checked={field.value} onCheckedChange={field.onChange} />
						</FormControl>
					</FormItem>
				)}
			/>
			<FormField
				control={form.control}
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
								placeholder="Digite o estoque em quilos"
								value={field.value}
								onChange={(e) => {
									if (/^[0-9]*$/.test(e.target.value) || !e.target.value) {
										field.onChange(e);
									} else {
										e.preventDefault();
									}
								}}
							/>
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
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
									Inclua informações sobre o produto, ex: calibre da fruta, grau
									Brix e detalhes relevantes.
								</TooltipContent>
							</Tooltip>
						</FormLabel>

						<FormControl>
							<Textarea
								placeholder="Ex: Manga Palmer, calibre 14, grauBrix 13,5, colhida no Vale do São Francisco, embalagem com 10 unidades embaladas em caixas, validade de 10 dias em refrigeração"
								className="resize-none min-h-32"
								{...field}
							/>
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>
		</>
	);
}
