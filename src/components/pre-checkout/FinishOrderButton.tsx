'use client';

import { Button } from '@/components/ui/button';
import { formatCooldown, getOrderCooldownRemainingMs } from '@/utils/orderSubmitCooldown';
import { LoaderCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface IFinishOrderButtonProps {
	submitting: boolean;
	disabled?: boolean;
	onClick: () => void;
}

// Componente próprio para que o tick de 1s da contagem regressiva re-renderize só
// o botão, e não o formulário inteiro (que recria os providers dos passos).
export default function FinishOrderButton({
	submitting,
	disabled = false,
	onClick,
}: IFinishOrderButtonProps) {
	const [remainingMs, setRemainingMs] = useState(0);

	useEffect(() => {
		const update = () => setRemainingMs(getOrderCooldownRemainingMs());
		update();
		const interval = setInterval(update, 1000);
		return () => clearInterval(interval);
	}, [submitting]);

	const waiting = !submitting && remainingMs > 0;

	return (
		<Button
			type="button"
			className="px-6 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
			onClick={onClick}
			disabled={disabled || submitting || waiting}
		>
			{submitting ? (
				<>
					<LoaderCircle className="size-4 animate-spin" />
					Enviando pedido...
				</>
			) : waiting ? (
				`Aguarde ${formatCooldown(remainingMs)}`
			) : (
				'Finalizar Compra'
			)}
		</Button>
	);
}
