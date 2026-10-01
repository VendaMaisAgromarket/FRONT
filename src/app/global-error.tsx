'use client';

import { useEffect, useState } from 'react';

// Captura exceções não tratadas que escapam de todos os error.tsx da árvore.
// O caso mais comum aqui é uma aba que ficou aberta com o bundle de ANTES do
// último deploy: o cliente tenta chamar uma Server Action ou buscar um chunk
// cujo hash não existe mais na build atual, e o servidor responde com uma
// exceção genérica (é exatamente o erro que "some" ao limpar o cache/recarregar).
// Em vez de exigir isso manualmente, tentamos um reload automático uma única
// vez por sessão; se o erro persistir depois do reload, é um bug real — aí
// mostramos a tela de erro normal com o digest para investigar nos logs.
export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	const [autoRecovering, setAutoRecovering] = useState(true);

	useEffect(() => {
		console.error(error);

		const key = 'stale-build-reload-attempted';
		let alreadyTried = false;
		try {
			alreadyTried = sessionStorage.getItem(key) === '1';
			sessionStorage.setItem(key, '1');
		} catch {
			// sessionStorage indisponível (modo privado, etc.) — segue com o reload único
		}

		if (!alreadyTried) {
			window.location.reload();
			return;
		}

		setAutoRecovering(false);
	}, [error]);

	if (autoRecovering) {
		return (
			<html lang="pt-BR">
				<body>
					<div
						style={{
							display: 'flex',
							minHeight: '100vh',
							alignItems: 'center',
							justifyContent: 'center',
							fontFamily: 'sans-serif',
							color: '#4b5563',
						}}
					>
						Atualizando...
					</div>
				</body>
			</html>
		);
	}

	return (
		<html lang="pt-BR">
			<body>
				<div
					style={{
						display: 'flex',
						minHeight: '100vh',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '1rem',
						fontFamily: 'sans-serif',
						padding: '2rem',
						textAlign: 'center',
					}}
				>
					<h1 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#111827' }}>
						Ocorreu um erro inesperado
					</h1>
					<p style={{ color: '#6b7280', maxWidth: 420 }}>
						Já tentamos recarregar a página automaticamente e o erro continuou.
						Isso indica um problema real — por favor avise o suporte.
					</p>
					{error.digest && (
						<code style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
							Digest: {error.digest}
						</code>
					)}
					<button
						onClick={() => reset()}
						style={{
							marginTop: '0.5rem',
							padding: '0.5rem 1.25rem',
							borderRadius: '0.375rem',
							backgroundColor: '#16a34a',
							color: 'white',
							border: 'none',
							cursor: 'pointer',
						}}
					>
						Tentar novamente
					</button>
				</div>
			</body>
		</html>
	);
}
