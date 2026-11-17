import { SignUpFormValues } from '@/lib/schemas';
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import {
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '../ui/form';
import { formatCpfCnpj, formatPhoneNumber } from '@/utils/functions';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import PasswordInput from '../passwordInput';
import PasswordRequirements from '../PasswordRequirements';
import { Input } from '../ui/input';
import DocumentsDialog from './DocumentsDialog';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

export function FirstPageSignUpForm({
	form,
	onUserTypeChange,
}: {
	form: UseFormReturn<SignUpFormValues>;
	onUserTypeChange: (
		type:
			| 'distributor'
			| 'cooperative-or-partnership'
			| 'farmer'
			| 'wholesaler'
			| 'supermarket'
	) => void;
}) {
	const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);
	const [documentModalContentType, setDocumentModalContentType] = useState<
		'privacyPolicy' | 'termsOfUse'
	>('privacyPolicy');
	const userType = form.watch('userType');

	function handleUserTypeChange(
		type:
			| 'distributor'
			| 'cooperative-or-partnership'
			| 'farmer'
			| 'wholesaler'
			| 'supermarket'
	) {
		form.setValue('userType', type);
		onUserTypeChange(type);
		//! Aguardando a possibilidade de cadastro como produtor individual
		// form.clearErrors(['cpf', 'cnpj']);
		// form.resetField('cpf');
	}

	function handleOpenDocumentModal(content: 'privacyPolicy' | 'termsOfUse') {
		setIsDocumentModalOpen(true);

		setDocumentModalContentType(content);
	}

	return (
		<>
			<FormField
				control={form.control}
				name="userType"
				render={({ field }) => (
					<FormItem>
						<FormLabel>Tipo de usuário <span className="text-red-500">*</span></FormLabel>

						<Select
							onValueChange={(v) =>
								handleUserTypeChange(
									v as
									| 'distributor'
									| 'cooperative-or-partnership'
									| 'farmer'
									| 'wholesaler'
									| 'supermarket'
								)
							}
							defaultValue={field.value}
						>
							<FormControl>
								<SelectTrigger className="w-full" size="lg">
									<SelectValue placeholder="Selecione sua categoria" />
								</SelectTrigger>
							</FormControl>

							<SelectContent>
								<SelectItem value="distributor">Sou Comprador/ Distribuidor</SelectItem>
								<SelectItem value="cooperative-or-partnership">
									Cooperativa/Associação
								</SelectItem>
								<SelectItem value="farmer">Produtor Rural</SelectItem>
								<SelectItem value="wholesaler">Atacadista</SelectItem>
								<SelectItem value="supermarket">Supermercado</SelectItem>
							</SelectContent>
						</Select>

						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="name"
				render={({ field }) => (
					<FormItem>
						<FormLabel htmlFor="name">
							Nome completo <span className="text-red-500">*</span>
						</FormLabel>

						<FormControl>
							<Input
								id="name"
								placeholder="Seu nome completo"
								className="w-full border border-border rounded h-12 px-4 py-3"
								{...field}
							/>
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>

			{/*! Aguardando a possibilidade de cadastro como produtor individual */}
			{/* {userType ===
				'buyer'(
					<FormField
						control={form.control}
						name="cpf"
						render={({ field }) => (
							<FormItem>
								<FormLabel htmlFor="cpf">
									CPF <span className="text-red-500">*</span>
								</FormLabel>
								<FormControl>
									<Input
										id="cpf"
										placeholder="000.000.000-00"
										className="w-full border border-border rounded h-12 px-4 py-3"
										{...field}
										value={formatCpf(field.value)}
										onChange={(e) => {
											const val = e.target.value.replace(/\D/g, '');
											field.onChange(val);
										}}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
				)} */}

			{(userType === 'cooperative-or-partnership' ||
				userType === 'distributor' ||
				userType === 'farmer' ||
				userType === 'wholesaler' ||
				userType === 'supermarket') && (
					<>
						<FormField
							control={form.control}
							name="cpfCnpj"
							render={({ field }) => {
								const isCpf = field.value.replace(/\D/g, '').length <= 11;
								return (
									<FormItem>
										<FormLabel htmlFor="cpfCnpj">
											CNPJ/CPF <span className="text-red-500">*</span>
										</FormLabel>

										<FormControl>
											<Input
												id="cpfCnpj"
												placeholder={isCpf ? '000.000.000-00' : '00.000.000/0000-00'}
												{...field}
												value={formatCpfCnpj(field.value)}
												onChange={(e) => {
													const val = e.target.value.replace(/\D/g, '').slice(0, 14);
													field.onChange(val);
												}}
												className="w-full border border-border rounded h-12 px-4 py-3"
											/>
										</FormControl>

										<FormMessage />
									</FormItem>
								);
							}}
						/>

						<FormField
							control={form.control}
							name="ccir"
							render={({ field }) => (
								<FormItem>
									<div className="flex items-center gap-1.5">
										<FormLabel htmlFor="ccir">CCIR</FormLabel>
										<Tooltip>
											<TooltipTrigger asChild>
												<button type="button" className="text-gray-400 hover:text-gray-600 focus:outline-none">
													<HelpCircle className="h-4 w-4" />
												</button>
											</TooltipTrigger>
											<TooltipContent className="max-w-72 text-wrap leading-relaxed">
												O CCIR (Certificado de Cadastro de Imóvel Rural) é emitido pelo INCRA e identifica imóveis rurais no Brasil. Necessário para financiamentos e regularização fundiária. Campo opcional.
											</TooltipContent>
										</Tooltip>
									</div>

									<FormControl>
										<Input
											id="ccir"
											placeholder="Digite seu CCIR"
											className="w-full border border-border rounded h-12 px-4 py-3"
											{...field}
										/>
									</FormControl>

									<FormMessage />
								</FormItem>
							)}
						/>
					</>
				)}

			<FormField
				control={form.control}
				name="phone_number"
				render={({ field }) => (
					<FormItem>
						<FormLabel htmlFor="telefone">
							Telefone <span className="text-red-500">*</span>
						</FormLabel>

						<FormControl>
							<Input
								id="telefone"
								placeholder="(99) 99999-9999"
								{...field}
								value={formatPhoneNumber(field.value)}
								onChange={(e) => {
									const val = e.target.value.replace(/\D/g, '');
									field.onChange(val);
								}}
								className="w-full border border-border rounded h-12 px-4 py-3"
							/>
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="email"
				render={({ field }) => (
					<FormItem>
						<FormLabel htmlFor="email">
							Email <span className="text-red-500">*</span>
						</FormLabel>

						<FormControl>
							<Input
								id="email"
								type="email"
								placeholder="usuario@email.com"
								{...field}
								className="w-full border border-border rounded h-12 px-4 py-3"
							/>
						</FormControl>
						<FormDescription className="text-xs">
							Usaremos este e-mail para avisos sobre seus pedidos e para recuperação de senha.
						</FormDescription>

						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="password"
				render={({ field }) => (
					<FormItem>
						<FormLabel htmlFor="senha">
							Senha <span className="text-red-500">*</span>
						</FormLabel>

						<FormControl>
							<PasswordInput field={field} />
						</FormControl>

						<PasswordRequirements password={field.value} />

						<FormMessage />
					</FormItem>
				)}
			/>

			<FormField
				control={form.control}
				name="confirmPassword"
				render={({ field }) => (
					<FormItem>
						<FormLabel htmlFor="confirmarSenha">
							Confirmar Senha <span className="text-red-500">*</span>
						</FormLabel>

						<FormControl>
							<PasswordInput field={field} />
						</FormControl>

						<FormMessage />
					</FormItem>
				)}
			/>

			<div className="space-y-2">
				<FormField
					control={form.control}
					name="acceptPrivacyPolicy"
					render={({ field }) => (
						<FormItem>
							<div className="flex flex-row items-center gap-2">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>

								<div className="text-sm font-normal space-x-1">
									<span>Para continuar você deve concordar com nossa</span>
									<button
										className="text-primary font-semibold cursor-pointer"
										type="button"
										onClick={() => handleOpenDocumentModal('privacyPolicy')}
									>
										Política de Privacidade
									</button>
								</div>
							</div>

							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="acceptTermsOfUse"
					render={({ field }) => (
						<FormItem>
							<div className="flex flex-row items-center gap-2">
								<FormControl>
									<Checkbox
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>

								<div className="text-sm font-normal space-x-1">
									<span>Para continuar você deve concordar com nossos</span>
									<button
										className="text-primary font-semibold cursor-pointer"
										type="button"
										onClick={() => handleOpenDocumentModal('termsOfUse')}
									>
										Termos de Uso
									</button>
								</div>
							</div>

							<FormMessage />
						</FormItem>
					)}
				/>

				<DocumentsDialog
					open={isDocumentModalOpen}
					onOpenChange={setIsDocumentModalOpen}
					documentType={documentModalContentType}
				/>
			</div>
		</>
	);
}
