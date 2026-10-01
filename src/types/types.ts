export type Product = {
	id: string;
	name: string;
	category: string;
	variety: string;
	price: number;
	stock: number;
	description: string;
	harvestAt: string;
	createdAt: string;
	isNegotiable: boolean;
	sellerId: string;
	sellingUnitsProduct: {
		unitId: string;
		minPrice: number;
	}[];
	images_Path: string[];
};

export type SellerGroup = {
	sellerId: string;
	sellerName: string;
	sellerProducts: CartDataProduct[];
};

export type UserPayload = {
	id: string;
	role: string;
	exp: number;
	jwt: string;
	email: string;
	name: string;
};

export type SignInFormState = {
	message: string;
	errors?: {
		[key: string]: string[] | undefined;
	};
};

export type Address = {
	id: string;
	userId: number;
	alias: string;
	street: string;
	cep: string;
	uf: string;
	city: string;
	number: string;
	complement: string;
	addressee: string;
	phone_number_addressee: string;
	referencePoint: string;
	default?: boolean;
};

export type IbgeApiUf = {
	id: number;
	sigla: string;
	nome: string;
};

export type IbgeApiCity = {
	id: number;
	nome: string;
};

export type UnitData = {
	id: string;
	unit: string;
	title: string;
};

type SellingUnitProduct = {
	id: string;
	unitId: string;
	minPrice: number;
	productId: string;
	unit: UnitData;
};

export type CartDataProduct = {
	id: string;
	cartId: string;
	productId: string;
	sellingUnitProductId: string;
	amount: number;
	value: number;
	product: {
		id: string;
		name: string;
		description: string;
		images_Path: string;
		seller: {
			id: string;
			name: string;
		};
	};
	sellingUnitProduct: SellingUnitProduct;
};

//! usando isso por enquanto o backend nao manda os produtos do carrinho organizados por vendedor
export type FormattedCartData = {
	sellerId: string;
	sellerName: string;
	products: CartDataProduct[];
};

export type CartDataType = {
	id: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
	user: { id: string; name: string };
	items: CartDataProduct[];
};

export type CartItemsContextType = {
	productId: string;
	sellingUnitProductId: string;
};

export type ProductToCart = {
	userId: string;
	productId: string;
	sellingUnitProductId: string;
	amount: number;
	value: number;
};

export type ProductToApi = {
	name: string;
	variety: string;
	category: string;
	stock: number;
	description: string;
	harvestAt: Date;
	isNegotiable: boolean;
	sellingUnitProduct: {
		unitId: string;
		minPrice: number;
	}[];
};

export type SellerProductList = {
	id: string;
	name: string;
	category: string;
	variety: string;
	images_Path: string[];
	harvestAt: string;
	isNegotiable: boolean;
	createdAt: string;
	sellingUnitProduct: SellingUnitProduct[];
};

export type MarketProductCardType = {
	id: string;
	name: string;
	sellingUnitProduct: Omit<
		SellingUnitProduct,
		'id' | 'productId' | 'unitId'
	>[];
	images_Path: string[];
	seller?: {
		name: string;
	};
};

export type TransportTypeData = {
	id: string;
	type: string;
	valueFreight: number;
};

export type PaymentMethodsData = {
	id: string;
	method: string;
};

export type OrderStatus =
    | 'new'                      // Pedido realizado
    | 'processing'               // Em processamento (após aceite)
    | 'down_payment_confirmed'   // Entrada (30%) confirmada — aguardando autorização de colheita
    | 'harvest_authorized'       // Colheita autorizada pelo vendedor
    | 'harvest_completed'        // Colheita concluída
    | 'weighing'                 // Em pesagem
    | 'awaiting_final_payment'   // Aguardando pagamento final (70%)
    | 'pickup'                   // Disponível para entrega
    | 'completed'                // Concluído
    | 'cancelled';               // Cancelado

export type OrderAction = 'accepted' | 'rejected' | null;

export type Order = {
	id: string;
	orderNumber?: number;
	buyer: string;
	product: string;
	description?: string;
	value: number; // in BRL
	payment: string;
	paymentCompleted?: boolean;
	status: OrderStatus;
	action?: OrderAction; // Nova propriedade para controlar se foi aceito/recusado
	cargoWeightKg?: string; // Peso da carga em kg
	createdAt?: string;
	decisionAt?: string; // data de aceite ou recusa pelo vendedor
};

// Tipos para a API de vendas
export type SaleBuyer = {
	id: string;
	name: string;
	email: string;
	phone_number: string;
	cpf: string | null;
};

export type SaleProduct = {
	id: string;
	name: string;
	category: string;
	variety: string;
	description: string;
	harvestAt?: string | null;
	images_Path: string[];
	productRating: number;
	sellerId: string;
	seller: {
		id: string;
		name: string;
		email: string;
		phone_number: string;
		cpf?: string | null;
		cnpj?: string | null;
	};
};

export type SaleUnit = {
	id: string;
	unit: string;
	title: string;
};

export type SaleSellingUnitProduct = {
	id: string;
	minPrice: number;
	unitId: number;
	unit: SaleUnit;
};

export type SaleBoughtProduct = {
	id: string;
	productId: string;
	sellingUnitProductId: string;
	value: number;
	amount: number;
	saleDataId: string;
	product: SaleProduct;
	sellingUnitProduct: SaleSellingUnitProduct;
};

export type SaleShippingAddress = {
	id: string;
	addressee: string;
	phone_number_addressee: string;
	street: string;
	number: string;
	complement: string;
	city: string;
	uf: string;
	cep: string;
};

export type SalePaymentMethod = {
	id: string;
	method: string;
};

export type SaleTransportType = {
	id: string;
	type: string;
	valueFreight: number;
};

export type SaleData = {
	id: string;
	transportTypeId: string;
	createdAt: string;
	updatedAt?: string;
	sellerApprovedAt?: string;
	shippedAt: string;
	arrivedAt: string;
	actualDeliveryDate?: string;
	transportValue: number;
	productRating: number;
	sellerRating: number;
	status: string;
	addressId: string;
	paymentMethodId: string;
	buyerId: string;
	paymentCompleted: boolean;
	/**
	 * Indica a decisão do vendedor sobre o pedido:
	 * true = aceito, false = recusado, null = pendente
	 */
	sellerApproved?: boolean | null;
	/** true quando a entrada de 30% foi confirmada pelo webhook */
	downPaymentCompleted?: boolean;
	/** Calculado pelo backend: true se 30% pago (resiliente a webhook miss) */
	firstInstallmentPaid?: boolean;
	/** Calculado pelo backend: true se pagamento final confirmado (resiliente a webhook miss) */
	finalPaymentPaid?: boolean;
	/** ID do documento de comprovante de pesagem da balança */
	weightDocumentId?: string | null;
	cargoWeightKg?: string;
	orderNumber?: number;
	packagingType?: string | null;
	buyer: SaleBuyer;
	boughtProducts: SaleBoughtProduct[];
	shippingAddress: SaleShippingAddress;
	paymentMethod: SalePaymentMethod;
	transportType: SaleTransportType;
};

export type SalesApiResponse = {
	message: string;
	totalSales: number;
	totalValue: number;
	sales: SaleData[];
};

export type ProductFromSeller = Pick<
	Product,
	'id' | 'name' | 'category' | 'variety' | 'images_Path' | 'harvestAt'
> & {
	sellingUnitProduct: SellingUnitProduct[];
};

export type SellerHeaderData = {
	name: string;
	img?: string;
};

export interface SellerProfileClientProps {
	sellerId: string;
}

export type FormImage = File | string;

export type SellingUnit = {
	id: string;
	title: string;
	unit: string;
};

// export type EditProductFormData = {
// 	name: string;
// 	category: string;
// 	variety: string;
// 	description: string;
// 	stock: number;
// 	harvestAt: Date;
// 	isNegotiable: boolean;
// 	productRating: number;
// 	ratingAmount: number;
// 	ratingStarAmount: number[];
// 	amountSold: number;
// 	images_Path: string[];
// 	images: string[];
// 	;
// };

export type PixPaymentParams = {
	saleId: string;
	paymentMethodId: string;
	amount: number;
	email: string;
	expirationMinutes?: number;
};

export type PixPaymentResponse = {
	paymentId: string;
	asaas_payment_id: string;
	payment: {
		id: string;
		status: string;
		qr_code?: string;
		qr_code_base64?: string;
		expiration_date?: string;
	};
};

export type PaymentSyncResponse = {
	success: boolean;
	updated?: boolean;
	message?: string;
	payment?: {
		id: string;
		status: string;
		asaas_payment_id: string;
	};
	asaas?: {
		id: string;
		status: string;
		value: number;
		paymentDate?: string;
		dueDate?: string;
	};
};

export type BoletoPaymentParams = {
	saleId: string;
	paymentMethodId: string;
	amount: number;
	expirationDays?: number;
};

export type BoletoPaymentResponse = {
	paymentId: string;
	asaas_payment_id: string;
	payment: {
		id: string;
		status: string;
		invoice_url: string;
		expiration_date: string;
		/** Pendente: Asaas não retorna mais estes campos; aguardando endpoint extra de linha digitável */
		barcode_content?: string;
		digitable_line?: string;
	};
};

// POST /payment/card (Asaas) — dados de cartão em claro; aguardando decisão
// de tokenização client-side antes de habilitar o formulário no frontend.
export type CardPaymentParams = {
	saleId: string;
	paymentMethodId: string;
	amount: number;
	phase?: 'down_payment' | 'final_payment' | 'full';
	installmentCount?: number;
	creditCard: {
		holderName: string;
		number: string;
		expiryMonth: string;
		expiryYear: string;
		ccv: string;
	};
	creditCardHolderInfo: {
		name: string;
		email: string;
		cpfCnpj: string;
		postalCode: string;
		addressNumber: string;
		phone: string;
	};
};

export type CardPaymentResponse = {
	paymentId: string;
	asaas_payment_id: string;
	status: string;
	phase?: string;
	payment: {
		id: string;
		status: string;
		brand?: string;
		lastDigits?: string;
	};
};

// Dashboard Executivo — Visão Executiva (GET /dashboard/executive-overview)
export type MonthlyForecastActual = {
	month: string;
	label: string;
	previsto: number;
	realizado: number;
};

export type ForecastActualAccumulated = {
	previsto: number;
	realizado: number;
};

export type ExecutiveOverviewCounters = {
	operacoesAtivas: number;
	operacoesConcluidas: number;
	operacoesBloqueadas: number;
	valorRetido: number;
};

export type FilterOption = {
	id: string;
	name: string;
};

export type ExecutiveOverviewFilterOptions = {
	produtos: FilterOption[];
	compradores: FilterOption[];
	vendedores: FilterOption[];
	tiposOperacao: FilterOption[];
};

export type ProductRevenue = {
	produto: string;
	valor: number;
	percentual: number;
};

export type OriginDestinationRoute = {
	origem: string;
	destino: string;
	quantidade: number;
	valor: number;
};

export type PartyRanking = {
	nome: string;
	faturamento: number;
	percentualParticipacao: number;
};

export type ExecutiveOverviewResponse = {
	period: { from: string; to: string };
	faturamento: {
		monthly: MonthlyForecastActual[];
		accumulated: ForecastActualAccumulated;
	};
	receita: {
		monthly: MonthlyForecastActual[];
		accumulated: ForecastActualAccumulated;
	};
	operacoes: {
		monthly: MonthlyForecastActual[];
	};
	counters: ExecutiveOverviewCounters;
	filterOptions: ExecutiveOverviewFilterOptions;
	faturamentoPorProduto: ProductRevenue[];
	origemDestino: OriginDestinationRoute[];
	principaisCompradores: PartyRanking[];
	principaisVendedores: PartyRanking[];
	pipeline: {
		statusCounts: PipelineStageCount[];
		terminal: PipelineStageCount[];
		funnel: PipelineFunnelBucket[];
	};
};

// Dashboard Executivo — Pipeline das Operações (GET /dashboard/pipeline)
export type PipelineStageCount = {
	stage: number;
	key: string;
	label: string;
	count: number;
};

export type PipelineFunnelBucket = {
	key: string;
	label: string;
	count: number;
};

export type PipelineListRow = {
	id: string;
	orderNumber: number;
	produto: string;
	comprador: string;
	vendedor: string;
	valor: number;
	status: string;
	diasEtapa: number;
};

export type PipelineList = {
	items: PipelineListRow[];
	page: number;
	pageSize: number;
	total: number;
	totalPages: number;
};

export type PipelineCounters = {
	operacoesAtivas: number;
	finalizadas: number;
	aguardandoPagamento: number;
	bloqueadas: number;
	taxaConversaoPercent: number;
	totalContratos: number;
};

export type PipelineGargalos = {
	aguardandoPagamento: number;
	bloqueadas: number;
	semDocumentos: number;
	entregaAtrasada: number;
};

export type PipelineStatusOption = {
	value: string;
	label: string;
	stages?: number[];
	blocked?: true;
};

export type PipelineFilterOptions = {
	produtos: FilterOption[];
	compradores: FilterOption[];
	vendedores: FilterOption[];
	tiposOperacao: FilterOption[];
	status: PipelineStatusOption[];
};

export type PipelineResponse = {
	statusCounts: PipelineStageCount[];
	terminal: PipelineStageCount[];
	funnel: PipelineFunnelBucket[];
	counters: PipelineCounters;
	gargalos: PipelineGargalos;
	filterOptions: PipelineFilterOptions;
	list: PipelineList;
};

// Dashboard Executivo — Alertas Operacionais (GET /dashboard/alerts)
export type AlertsCounters = {
	criticos: number;
	medios: number;
	resolvidos: number;
	bloqueadas: number;
	saudeOperacionalPercent: number | null;
};

export type AlertsCounts = {
	semPagamentoAntesColheita: number;
	documentosPendentes: number;
	entregaAtrasada: number;
	bloqueadas: number;
	semTermoAditivo: number;
};

export type AlertsCategoryBreakdown = {
	categoria: string;
	count: number;
	percentual: number;
};

export type AlertsMonthlyTrend = {
	month: string;
	label: string;
	criticos: number;
	medios: number;
	resolvidos: number;
};

export type AlertsFilterOptions = {
	categorias: string[];
	criticidades: string[];
	parceiros: FilterOption[];
};

// Hoje o back só emite "Aberto" nos itens da lista (resolvidos só existe como
// contador agregado, sem item individual) — modelado como união pra não travar
// o tipo assim que o back passar a listar itens resolvidos também.
export type AlertStatus = "Aberto" | "Resolvido";

export type AlertItem = {
	id: string;
	orderNumber: number;
	categoria: string;
	criticidade: string;
	parceiro: string;
	descricao: string;
	dataHora: string;
	diasEmAberto: number;
	acao: string;
	status: AlertStatus;
};

export type AlertsResponse = {
	counters: AlertsCounters;
	counts: AlertsCounts;
	porCategoria: AlertsCategoryBreakdown[];
	evolucaoMensal: AlertsMonthlyTrend[];
	filterOptions: AlertsFilterOptions;
	list: {
		items: AlertItem[];
		total: number;
		limit: number;
	};
};

// Dashboard Executivo — Logística e Desempenho (GET /dashboard/logistics)
export type LogisticsPerformanceRow = {
	id: string;
	name: string;
	delivered: number;
	onTimePercent: number;
	alerta: boolean;
};

export type LogisticsResponse = {
	deliveredCount: number;
	averageDeliveryDays: number | null;
	onTimePercent: number | null;
	averageDelayDays: number | null;
	byBuyer: LogisticsPerformanceRow[];
	bySeller: LogisticsPerformanceRow[];
};
