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
		// Permitir apenas HTTPS ou localhost para desenvolvimento
		return (
			urlObj.protocol === 'https:' ||
			urlObj.hostname === 'localhost' ||
			urlObj.hostname === '127.0.0.1' ||
			urlObj.hostname.endsWith('.asaas.com') ||
			urlObj.hostname === 'asaas.com'
		);
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

