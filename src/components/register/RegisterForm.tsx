'use client';

import { Button } from '@/components/ui/button';
import { Form } from '@/components/ui/form';
import { signUpSchema } from '@/lib/schemas';
import { signUpFormSteps } from '@/utils/data';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import mapUserTypeToFancyName from '@/utils/mappers/userTypeToFancyname';
import { signUp } from '@/actions/auth';
import { CERTIFICATION_ROUTES } from '@/components/certifications/certificationUtils';
import { loginUrl } from '@/lib/authRedirect';
import { SignUpFormValues } from '@/lib/schemas';
import { toast } from 'sonner';
import { FirstPageSignUpForm } from './FirstPageSignUpForm';
import { SecondPageSignUpForm } from './SecondPageSignUpForm';

type RegisterFormProps = {
	registerAs:
	| 'distributor'
	| 'cooperative-or-partnership'
	| 'farmer'
	| 'wholesaler'
	| 'supermarket'
	| undefined;
	onUserTypeChange: (
		type:
			| 'distributor'
			| 'cooperative-or-partnership'
			| 'farmer'
			| 'wholesaler'
			| 'supermarket'
			| undefined
	) => void;
};

export default function RegisterForm({
	registerAs,
	onUserTypeChange,
}: RegisterFormProps) {
	const [formPosition, setFormPosition] = useState<number>(0);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const router = useRouter();

	const form = useForm<SignUpFormValues>({
		resolver: zodResolver(signUpSchema),
		defaultValues: {
			userType: registerAs as
				| 'distributor'
				| 'cooperative-or-partnership'
				| 'farmer'
				| 'wholesaler'
				| 'supermarket',
			name: '',
			cpfCnpj: '',
			ccir: '',
			phone_number: '',
			email: '',
			password: '',
			confirmPassword: '',
			firstSecurityQuestion: '',
			secondSecurityQuestion: '',
			thirdSecurityQuestion: '',
		},
	});

	const { trigger } = form;

	type Tfields = keyof SignUpFormValues;

	const userType = form.watch('userType');

	async function onSubmit(data: SignUpFormValues) {
		setIsSubmitting(true);
		const res = await signUp(data);

		if (res.success) {
			setIsSubmitting(false);

			// Produtor: depois de entrar, mostra o passo opcional "Sua fazenda tem certificação?"
			// (o cadastro é público e não recebe a certificação).
			router.push(
				data.userType === 'farmer'
					? loginUrl(undefined, `${CERTIFICATION_ROUTES.producerList}?onboarding=1`)
					: '/login'
			);
			return toast.success(res.message);
		}

		toast.error(res.message);
		setFormPosition(0);
		form.setValue('acceptPrivacyPolicy', false);
		form.setValue('acceptTermsOfUse', false);
		setIsSubmitting(false);
	}

	async function showNextForm() {
		const fields = signUpFormSteps[formPosition].fields;
		const validation = await trigger(fields as Tfields[], {
			shouldFocus: true,
		});

		if (!validation) return;

		if (formPosition === signUpFormSteps.length - 1) {
			await form.handleSubmit(onSubmit)();
			return;
		}

		setFormPosition((prev) => prev + 1);
	}

	function handleReturnButtonBehavior() {
		if (formPosition === signUpFormSteps.length - 1) {
			setFormPosition(0);
			return;
		}
		router.push('/login');
	}

	function getSubmitButtonText() {
		if (formPosition < 1) {
			return 'Avançar';
		}

		return isSubmitting ? 'Cadastrando' : 'Cadastrar';
	}

	return (
		<>
			<button
				className="absolute top-6 left-6 text-gray-600 hover:text-black cursor-pointer"
				onClick={handleReturnButtonBehavior}
			>
				<ArrowLeft />
			</button>

			<div className="flex flex-col items-center gap-2 mb-6">
				<h2 className="text-2xl font-bold text-center">
					{signUpFormSteps[formPosition].title}
				</h2>

				<span className="text-sm text-center text-gray-600">
					{signUpFormSteps[formPosition].description}
				</span>

				<span className="mt-2">
					Registrando-se como:{' '}
					<span className="font-semibold text-primary">
						{mapUserTypeToFancyName(userType)}
					</span>
				</span>
			</div>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					{formPosition === 0 && (
						<FirstPageSignUpForm
							form={form}
							onUserTypeChange={onUserTypeChange}
						/>
					)}

					{formPosition === 1 && <SecondPageSignUpForm form={form} />}

					<Button
						type="button"
						disabled={isSubmitting}
						onClick={showNextForm}
						className="w-full p-3 mt-4 h-12 text-white rounded font-medium bg-primary hover:bg-success transition"
					>
						{isSubmitting && <LoaderCircle className="animate-spin" />}
						{getSubmitButtonText()}
					</Button>
				</form>
			</Form>
		</>
	);
}
