import { Barcode, CreditCard } from 'lucide-react';
import Image from 'next/image';
import React from 'react';

interface PaymentMethod {
	method: string;
	icon: React.ReactNode;
	description: string;
	wip?: boolean;
}

const paymentMethods: PaymentMethod[] = [
	{
		method: 'pix',
		icon: (
			<Image
				src="/pix.svg"
				alt="Pix"
				width={16}
				height={16}
				className="object-contain"
			/>
		),
		description: 'Aprovação imediata',
	},
	{
		method: 'cartão',
		icon: <CreditCard size={16} className="text-neutral-300" />,
		description: 'Parcelamento em até 24x.',
		// Aguardando decisão de tokenização client-side com o novo gateway
		// de pagamento antes de habilitar o pagamento com cartão.
		wip: true,
	},
	{
		method: 'boleto',
		icon: <Barcode size={16} className="text-black" />,
		description: 'Aprovação em até 3 dias úteis.',
	},
];

export function getIcon(method: string) {
	return paymentMethods.find((m) =>
		m.method.toLowerCase().includes(method.split(' ')[0])
	)?.icon;
}

export function getDescription(method: string) {
	return paymentMethods.find((m) => m.method === method)?.description;
}

export function isWip(method: string) {
	const isWip = paymentMethods.find((m) =>
		m.method.toLowerCase().includes(method.split(' ')[0])
	)?.wip;
	return isWip === undefined ? false : isWip;
}
