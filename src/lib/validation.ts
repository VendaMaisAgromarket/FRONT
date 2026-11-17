/**
 * Funções de validação e sanitização para segurança
 */

/**
 * Valida se uma string é um UUID válido
 */
export function isValidUUID(str: string): boolean {
	const uuidRegex =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	return uuidRegex.test(str);
}

/**
 * Sanitiza uma string removendo caracteres perigosos
 */
export function sanitizeString(str: string, maxLength = 200): string {
	if (typeof str !== 'string') return '';
	return str
		.replace(/[<>]/g, '') // Remove < e >
		.replace(/javascript:/gi, '') // Remove javascript:
		.replace(/on\w+=/gi, '') // Remove event handlers
		.substring(0, maxLength)
		.trim();
}

/**
 * Valida se uma URL é segura (HTTPS ou localhost)
 */
export function isValidPaymentUrl(url: string): boolean {
	if (typeof url !== 'string' || !url) return false;
	try {
		const urlObj = new URL(url);
		// localhost é permitido só para desenvolvimento (qualquer protocolo).
		// Para produção, exige HTTPS E hostname na allowlist do gateway —
		// nunca aceitar HTTPS arbitrário nem o gateway em HTTP puro.
		const isLocalDev = urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1';
		const isTrustedGatewayHost =
			urlObj.hostname === 'asaas.com' || urlObj.hostname.endsWith('.asaas.com');
		return isLocalDev || (urlObj.protocol === 'https:' && isTrustedGatewayHost);
	} catch {
		return false;
	}
}

/**
 * Valida valores numéricos para evitar NaN ou valores inválidos
 */
export function isValidNumber(value: number): boolean {
	return (
		typeof value === 'number' &&
		!isNaN(value) &&
		isFinite(value) &&
		value >= 0 &&
		value <= 1000000000 // Limite máximo de 1 bilhão
	);
}

/**
 * Valida se uma string não está vazia e tem formato básico válido
 */
export function isValidId(str: string | null | undefined): boolean {
	if (str === null || str === undefined) return false;
	const strValue = String(str).trim();
	return strValue.length > 0 && strValue.length <= 100;
}

/**
 * Valida dados de pagamento antes de enviar.
 * Quando phase === "down_payment", o amount não é validado — o backend
 * ignora o valor enviado e calcula o valor correto da entrada (30%).
 */
export function validatePaymentData(data: {
	saleId: string;
	paymentMethodId: string;
	productId: string;
	title: string;
	unit_price: number;
	quantity: number;
	amount?: number;
	phase?: string;
}): { valid: boolean; error?: string } {
	if (!isValidUUID(data.saleId)) {
		return { valid: false, error: 'ID da venda inválido' };
	}

	if (!data.paymentMethodId || typeof data.paymentMethodId !== 'string') {
		return { valid: false, error: 'ID do método de pagamento inválido' };
	}

	const paymentMethodIdStr = String(data.paymentMethodId).trim();
	if (paymentMethodIdStr.length === 0 || paymentMethodIdStr.length > 100) {
		return { valid: false, error: 'ID do método de pagamento inválido' };
	}

	if (!isValidUUID(data.productId)) {
		return { valid: false, error: 'ID do produto inválido' };
	}

	if (!data.title || data.title.length > 200) {
		return { valid: false, error: 'Título inválido' };
	}

	if (!isValidNumber(data.unit_price)) {
		return { valid: false, error: 'Preço unitário inválido' };
	}

	if (!isValidNumber(data.quantity) || data.quantity <= 0 || data.quantity > 10000) {
		return { valid: false, error: 'Quantidade inválida' };
	}

	// Para phase down_payment o backend calcula o valor — não validar amount
	if (data.phase !== 'down_payment') {
		if (data.amount == null || !isValidNumber(data.amount) || data.amount <= 0) {
			return { valid: false, error: 'Valor total inválido' };
		}
	}

	return { valid: true };
}


/** Valida CPF pelos dígitos verificadores (aceita com ou sem máscara). */
export function isValidCpf(value: string): boolean {
	const cpf = value.replace(/\D/g, "");
	if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;

	const digit = (len: number) => {
		let sum = 0;
		for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
		const rest = (sum * 10) % 11;
		return rest === 10 ? 0 : rest;
	};
	return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

/** Valida CNPJ pelos dígitos verificadores (aceita com ou sem máscara). */
export function isValidCnpj(value: string): boolean {
	const cnpj = value.replace(/\D/g, "");
	if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

	const digit = (len: number) => {
		const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
		const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
		const rest = sum % 11;
		return rest < 2 ? 0 : 11 - rest;
	};
	return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13]);
}

/** Mesma regra de senha do backend: 8+ caracteres, maiúscula, minúscula, número e caractere especial. */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
