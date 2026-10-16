'use client';

import { Button } from '@/components/ui/button';
import { Form, FormField } from '@/components/ui/form';
import { preCheckoutSchema } from '@/lib/schemas';
import { useCheckoutStore } from '@/store/useCheckoutStore';
import { checkoutSteps } from '@/utils/data';
import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import * as z from 'zod';
import AddressStep from './AddressStep';
import PaymentStep from './PaymentStep';
import ReviewStep from './ReviewStep';
import TermsStep from './TermsStep';
import TransportStep from './TransportStep';
import { createNewOrder } from '@/actions/order';
import { acceptContract } from '@/actions/contract';
import { toast } from 'sonner';
import TanstackProvider from '@/providers/tanstackProvider';
import { useRouter } from 'next/navigation';
import FinishOrderButton from './FinishOrderButton';
import {
	clearOrderCooldown,
	formatCooldown,
	getOrderCooldownRemainingMs,
	startOrderCooldown,
} from '@/utils/orderSubmitCooldown';

export type PreCheckoutFormType = z.infer<typeof preCheckoutSchema>;

interface IPreCheckoutFormProps {
	step: number;
	setStep: Dispatch<SetStateAction<number>>;
}

export default function PreCheckoutForm({
	step,
	setStep,
}: IPreCheckoutFormProps) {
	const form = useFormContext<PreCheckoutFormType>();
	const { trigger, control, handleSubmit } = form;
	const { getSellers, getProducts, packagingType, contractSnapshot } = useCheckoutStore();
	const sellers = getSellers();
	const router = useRouter();
	const [addressError, setAddressError] = useState(false);
	// Trava síncrona contra duplo clique: o state só reflete no próximo render
	const submittingRef = useRef(false);
	const [submitting, setSubmitting] = useState(false);
	const isLastStep = step === checkoutSteps.length - 1;

	async function onSubmit(values: PreCheckoutFormType) {
		const products = getProducts();

		const payload = {
			transportTypeId: values.transport[0].transportTypeId,
			addressId: null,
			transportValue: 0,
			paymentMethodId: values.payment.methodId,
			packagingType: packagingType || undefined,
			boughtProducts: products.map((p) => ({
				productId: p.productId,
				sellingUnitProductId: p.sellingUnitProductId,
				amount: p.amount,
			})),
		};

		// A espera começa no envio, não no sucesso: com a rota lenta o pedido pode ser
		// criado mesmo que a resposta não chegue.
		startOrderCooldown();

		let res: Awaited<ReturnType<typeof createNewOrder>>;
		try {
			res = await createNewOrder(payload);
		} catch {
			toast.error(
				'Não foi possível confirmar o pedido. Confira em "Meus pedidos" antes de tentar novamente.'
			);
			return;
		}

		// 4xx = o back recusou o pedido (nada foi criado): libera para corrigir e reenviar.
		// Em 5xx/timeout a espera é mantida, pois o pedido pode ter sido gravado.
		if (!res.success && res.status >= 400 && res.status < 500) {
			clearOrderCooldown();
		}

		if (res.success) {
			// Persist the accepted contract snapshot to the backend
			if (res.orderId) {
				await acceptContract({ saleId: res.orderId, ...contractSnapshot }).catch(
					(err) => console.error("[acceptContract]", err)
				);
			}
			toast.success(res.message);
			router.push('/market/history');
			return;
		}

		if (res.code === 'USER_ADDRESS_REQUIRED') {
			toast.error('Cadastre um endereço antes de prosseguir com a compra.');
			router.push(
				'/market/profile/personal-info/addresses/new-address?redirect=/market/pre-checkout'
			);
			return;
		}

		toast.error(res.message);
	}

	async function showNextForm() {
		if (step === 3 && addressError) return;

		const fields = checkoutSteps[step]?.fields ?? [];
		const valid = await trigger(fields as (keyof PreCheckoutFormType)[], {
			shouldFocus: true,
		});
		if (!valid) return;

		if (!isLastStep) {
			setStep(step + 1);
		}
	}

	async function finishOrder() {
		if (submittingRef.current) return;

		const remaining = getOrderCooldownRemainingMs();
		if (remaining > 0) {
			toast.info(
				`Seu pedido já foi enviado. Confira em "Meus pedidos" ou aguarde ${formatCooldown(remaining)} para tentar novamente.`
			);
			return;
		}

		submittingRef.current = true;
		setSubmitting(true);
		try {
			const fields = checkoutSteps[step]?.fields ?? [];
			const valid = await trigger(fields as (keyof PreCheckoutFormType)[], {
				shouldFocus: true,
			});
			if (!valid) return;
			await handleSubmit(onSubmit)();
		} finally {
			submittingRef.current = false;
			setSubmitting(false);
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => {
					e.preventDefault();
					if (isLastStep) finishOrder();
					else showNextForm();
				}}
				className="space-y-6"
			>
				{/* {step === 0 && (
					<FormField
						name="insurance"
						control={control}
						render={({ field }) => <InsuranceStep {...field} />}
					/>
				)} */}

				{step === 0 && (
					<FormField
						name="address"
						control={control}
						render={() => <AddressStep />}
					/>
				)}

				{step === 1 && (
					<TanstackProvider>
						<FormField
							name="transport"
							control={control}
							render={() => <TransportStep sellers={sellers} />}
						/>
					</TanstackProvider>
				)}

				{step === 2 && (
					<TanstackProvider>
						<FormField
							name="payment"
							control={control}
							render={() => <PaymentStep />}
						/>
					</TanstackProvider>
				)}
				{step === 3 && (
					<ReviewStep
						sellers={sellers}
						setStep={setStep}
						onAddressError={setAddressError}
					/>
				)}

				{step === 4 && <FormField name="terms" render={() => <TermsStep />} />}

				<div className="flex justify-between pt-6">
					<Button
						type="button"
						variant="outline"
						onClick={() => setStep((s) => Math.max(0, s - 1))}
						disabled={step === 0 || submitting}
						className="px-6"
					>
						Voltar
					</Button>

					{isLastStep ? (
						<FinishOrderButton submitting={submitting} onClick={finishOrder} />
					) : (
						<Button
							type="button"
							className="px-6 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
							onClick={showNextForm}
							disabled={step === 3 && addressError}
						>
							Continuar
						</Button>
					)}
				</div>
			</form>
		</Form>
	);
}
