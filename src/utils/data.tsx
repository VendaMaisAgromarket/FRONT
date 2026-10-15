import {
	Bell,
	Apple,
	ArrowDownAZ,
	BadgePercent,
	Calendar,
	CalendarCheck2,
	CalendarClock,
	CalendarFold,
	HandCoins,
	Handshake,
	HeartPlus,
	LayoutDashboard,
	LogOut,
	Mail,
	ShoppingBag,
} from "lucide-react";

export const recentSearchesData = [
	{ id: 1, searched: "Manga" },
	{ id: 2, searched: "Banana" },
	{ id: 3, searched: "Maçã" },
	{ id: 4, searched: "Laranja" },
	{ id: 5, searched: "Abacaxi" },
];

export const sectionsListData = [
	{
		group: "Pessoal",
		sections: [
			{
				icon: <ShoppingBag size={20} />,
				title: "Meus Pedidos",
				href: "/market/history",
				type: "default",
			},
			{
				icon: <Bell size={20} />,
				title: "Notificações",
				href: "/market/notificacoes",
				type: "default",
			},
			// {
			// 	icon: <Settings size={20} />,
			// 	title: "Configurações",
			// 	href: "/market#",
			// },
			// {
			// 	icon: <PersonStanding size={20} />,
			// 	title: "Acessibilidade",
			// 	href: "/market#",
			// },
			// {
			// 	icon: <MessageCircleQuestion size={20} />,
			// 	title: "Perguntas",
			// 	href: "/market#",
			// },
		],
	},
	{
		group: "Comércio",
		sections: [
			{
				icon: <Apple size={20} />,
				title: "Meus produtos",
				href: "/market/myproducts",
				type: "default",
			},
			{
				icon: <HandCoins size={20} />,
				title: "Vender",
				href: "/market/create-product",
				type: "default",
			},
			{
				icon: <LayoutDashboard size={20} />,
				title: "Painel de vendas",
				href: "/market/orders",
				type: "default",
			},
		],
	},
	{
		group: "Plataforma",
		sections: [
			{
				icon: <Mail size={20} />,
				title: "Fale Conosco",
				href: "/market/contact",
				type: "default",
			},
			// {
			// 	icon: <Info size={20} />,
			// 	title: "Suporte",
			// 	href: "/market#",
			// },
			// {
			// 	icon: <ServerCrash size={20} />,
			// 	title: "Reportar problema",
			// 	href: "/market#",
			// },
			{
				icon: <LogOut size={20} />,
				title: "Sair",
				href: "/market#",
				type: "logout",
			},
		],
	},
];

export const headerSections = [
	{
		title: "Ofertas do dia",
		description:
			"Explore os produtos com desconto e garanta o melhor preço de compra.",
		icon: (
			<BadgePercent className="text-primary w-[32px] h-[32px] md:w-[96px] md:h-[96px]" />
		),
		href: "/market#",
	},
	{
		title: "Mais vendidos",
		description:
			"Veja os itens mais vendidos da plataforma e encontre os produtos preferidos dos nossos usuários.",
		icon: (
			<HeartPlus className="text-primary w-[32px] h-[32px] md:w-[96px] md:h-[96px]" />
		),
		href: "/market/best-sellers",
	},
	{
		title: "Categorias",
		description:
			"Explore todas nossas categorias de produtos, encontrando aquela que satisfaz suas necessidades.",
		icon: (
			<ArrowDownAZ className="text-primary w-[32px] h-[32px] md:w-[96px] md:h-[96px]" />
		),
		href: "/market#categorias",
	},
];

export const footerSections = [
	{
		group: "Venda+",
		sections: [
			{ section: "Sobre nós", href: "/market#" },
			{ section: "Perguntas Frequentes", href: "/market#" },
			{ section: "Central de Ajuda", href: "/market#" },
			{ section: "Política de privacidade", href: "/market#" },
		],
	},
	{
		group: "Para você",
		sections: [
			{ section: "Sua Conta", href: "/market#" },
			{ section: "Anúncie seu Produto", href: "/market#" },
			{ section: "Frete e Prazo de Entrega", href: "/market#" },
			{ section: "Devoluções e Reembolsos", href: "/market#" },
		],
	},
];

export const sellingUnits = [
	{
		label: "Caixa",
		acronym: "cx",
		value: "box",
	},
	{
		label: "Quilograma",
		acronym: "kg",
		value: "kg",
	},
	{
		label: "Tonelada",
		acronym: "ton",
		value: "tons",
	},
	{
		label: "Cento",
		acronym: "cento",
		value: "cent",
	},
	{
		label: "Saco",
		acronym: "sc",
		value: "bag",
	},
	{
		label: "Engradado",
		acronym: "eng",
		value: "crate",
	},
];

export const ufs = [
	{ state: "São Paulo", amount: 120 },
	{ state: "Rio de Janeiro", amount: 95 },
	{ state: "Minas Gerais", amount: 150 },
	{ state: "Bahia", amount: 80 },
	{ state: "Paraná", amount: 110 },
];

export const newProductFormSteps = [
	{
		id: 0,
		fields: [
			"name",
			"category",
			"amount",
			"brix",
			"description",
			"variety",
			"harvestAt",
			"isNegotiable",
		],
		description: "Preencha os dados iniciais do seu produto.",
	},
	{
		id: 1,
		fields: ["sellingUnits"],
		description: "Informe as unidades e os preços mínimos de venda.",
	},
	{
		id: 2,
		fields: ["images"],
		description: "Coloque as fotos do seu produto.",
	},
];

export const signUpFormSteps = [
	{
		id: 0,
		fields: [
			"userType",
			"name",
			"cpfCnpj",
			"ccir",
			"phone_number",
			"email",
			"password",
			"confirmPassword",
			"acceptPrivacyPolicy",
			"acceptTermsOfUse",
		],
		title: "Crie sua conta",
		description: "Selecione o tipo de usuário e preencha os dados abaixo.",
	},
	{
		id: 1,
		fields: [
			"firstSecurityQuestion",
			"secondSecurityQuestion",
			"thirdSecurityQuestion",
		],
		title: "Estamos quase lá",
		description: "Finalize o cadastro respondendo as perguntas de segurança.",
	},
];

export const checkoutSteps = [
	// {
	// 	id: 0,
	// 	fields: ["insurance"],
	// 	title: "Seguro",
	// },
	{
		id: 0,
		fields: ["address"],
		title: "Entrega",
	},
	{
		id: 1,
		fields: ["transport"],
		title: "Transporte",
	},
	{
		id: 2,
		fields: ["payment"],
		title: "Pagamento",
	},
	{
		id: 3,
		title: "Revisão",
		fields: ["review"],
	},
	{
		id: 4,
		title: "Termo",
		fields: ["terms"],
	},
];

export const transportTypes = {
	catch: [
		{
			label: "Retirada",
			value: "collect",
			description: "Retire diretamente com o vendedor.",
			icon: Handshake,
			price: 0,
		},
	],
	send: [
		{
			label: "Básico",
			value: "basic",
			description: "Chegada entre 17 e 19 de julho, na próxima semana.",
			icon: HandCoins,
			price: 0,
		},
		{
			label: "Rápido",
			value: "fast",
			description: "Chegada entre 10 e 12 de julho, nessa semana.",
			icon: null,
			price: 2560,
		},
		{
			label: "Expresso",
			value: "express",
			description: "Chega amanhã.",
			icon: null,
			price: 5000,
		},
	],
};

export const varietyOptions = [
	// Mangas
	{ value: "ataulfo", label: "Ataulfo (Honey)" },
	{ value: "carlota", label: "Carlota" },
	{ value: "espada", label: "Espada" },
	{ value: "francis", label: "Francis" },
	{ value: "haden", label: "Haden" },
	{ value: "irwin", label: "Irwin" },
	{ value: "keitt", label: "Keitt" },
	{ value: "kent", label: "Kent" },
	{ value: "manga_bourbon", label: "Manga Bourbon" },
	{ value: "palmer", label: "Palmer" },
	{ value: "parvin", label: "Parvin" },
	{ value: "rosa", label: "Rosa" },
	{ value: "tommy_atkins", label: "Tommy Atkins" },
	{ value: "uba", label: "Ubá" },

	// Uvas
	{ value: "cabernet_sauvignon", label: "Cabernet Sauvignon" },
	{ value: "carmenere", label: "Carménère" },
	{ value: "chardonnay", label: "Chardonnay" },
	{ value: "concord", label: "Concord" },
	{ value: "crimson_seedless", label: "Crimson Seedless" },
	{ value: "gewurztraminer", label: "Gewürztraminer" },
	{ value: "isabel", label: "Isabel" },
	{ value: "italia", label: "Italia" },
	{ value: "malbec", label: "Malbec" },
	{ value: "merlot", label: "Merlot" },
	{ value: "moscato", label: "Moscato (Moscatel)" },
	{ value: "niagara", label: "Niagara" },
	{ value: "pinot_noir", label: "Pinot Noir" },
	{ value: "riesling", label: "Riesling" },
	{ value: "sauvignon_blanc", label: "Sauvignon Blanc" },
	{ value: "syrah", label: "Syrah (Shiraz)" },
	{ value: "tempranillo", label: "Tempranillo" },
	{ value: "thompson_seedless", label: "Thompson Seedless (Sultana)" },

	// Bananas
	{ value: "blue_java", label: "Blue Java" },
	{ value: "figo", label: "Figo" },
	{ value: "maca", label: "Maçã" },
	{ value: "marmelo", label: "Marmelo" },
	{ value: "mysore", label: "Mysore" },
	{ value: "nanica", label: "Nanica (Cavendish)" },
	{ value: "ouro", label: "Ouro" },
	{ value: "pacovan", label: "Pacovan" },
	{ value: "prata", label: "Prata" },
	{ value: "red_dacca", label: "Red Dacca" },
	{ value: "terra", label: "Terra" },

	// Outro
	{ value: "outro", label: "Outro" },
];

export const insuranceOptions = [
	{
		id: 0,
		title: "Básico",
		description: "Roubo, extravio, avaria física",
		value: 325,
	},
	{
		id: 1,
		title: "Perecíveis",
		description: "Deterioração por atraso",
		value: 499.9,
	},
	{
		id: 2,
		title: "All Risk",
		description: "Todos os riscos acima",
		recommended: true,
		value: 999.9,
	},
];

export const harvestAtStyles = {
	C: {
		color: "text-green-700",
		icon: <CalendarCheck2 size={16} />,
		tooltipMessage: "Produto colhido!",
	},
	W: {
		color: "text-red-700",
		icon: <CalendarClock size={16} />,
		tooltipMessage: "Produto será colhido daqui a 1 semana!",
	},
	Q: {
		color: "text-yellow-700",
		icon: <CalendarFold size={16} />,
		tooltipMessage: "Produto será colhido daqui a 15 dias!",
	},
	N: {
		color: "text-gray-600",
		icon: <Calendar size={16} />,
		tooltipMessage: "Data estimada em que o produto será colhido.",
	},
};

/*
TODO: Remover esses dados quando o backend adicionar as tabelas de categorias e variedades no banco
além disso, os dados em 'value' estão escritos iguais ao label por conta disso
*/
export const fruitVarieties = {
	manga: [
		{ value: "Ataulfo", label: "Ataulfo (Honey)" },
		{ value: "Carlota", label: "Carlota" },
		{ value: "Espada", label: "Espada" },
		{ value: "Francis", label: "Francis" },
		{ value: "Haden", label: "Haden" },
		{ value: "Irwin", label: "Irwin" },
		{ value: "Keitt", label: "Keitt" },
		{ value: "Kent", label: "Kent" },
		{ value: "Bourbon", label: "Manga Bourbon" },
		{ value: "Palmer", label: "Palmer" },
		{ value: "Parvin", label: "Parvin" },
		{ value: "Rosa", label: "Rosa" },
		{ value: "Tommy Atkins", label: "Tommy Atkins" },
		{ value: "Ubá", label: "Ubá" },
	],
	uva: [
		{ value: "Cabernet Sauvignon", label: "Cabernet Sauvignon" },
		{ value: "Carmenere", label: "Carménère" },
		{ value: "Chardonnay", label: "Chardonnay" },
		{ value: "Concord", label: "Concord" },
		{ value: "Crimson Seedless", label: "Crimson Seedless" },
		{ value: "Gewürztraminer", label: "Gewürztraminer" },
		{ value: "Isabel", label: "Isabel" },
		{ value: "Italia", label: "Italia" },
		{ value: "Malbec", label: "Malbec" },
		{ value: "Merlot", label: "Merlot" },
		{ value: "Moscato", label: "Moscato (Moscatel)" },
		{ value: "Niagara", label: "Niagara" },
		{ value: "Pinot Noir", label: "Pinot Noir" },
		{ value: "Riesling", label: "Riesling" },
		{ value: "Sauvignon Blanc", label: "Sauvignon Blanc" },
		{ value: "Syrah", label: "Syrah (Shiraz)" },
		{ value: "Tempranillo", label: "Tempranillo" },
		{ value: "Thompson Seedless", label: "Thompson Seedless (Sultana)" },
	],
	banana: [
		{ value: "Blue Java", label: "Blue Java (Ice Cream Banana)" },
		{ value: "Figo", label: "Figo" },
		{ value: "Maçã", label: "Maçã" },
		{ value: "Marmelo", label: "Marmelo" },
		{ value: "Mysore", label: "Mysore" },
		{ value: "Nanica", label: "Nanica (Cavendish)" },
		{ value: "Ouro", label: "Ouro" },
		{ value: "Pacovan", label: "Pacovan" },
		{ value: "Prata", label: "Prata" },
		{ value: "Red Dacca", label: "Red Dacca (banana vermelha)" },
		{ value: "Terra", label: "Terra" },
	],
};

export const fruitsCategories = [
	{
		value: "Tropical",
		label: "Tropicais",
		imageSrc: "/pineapple.jpg",
		imageAlt: "Limão",
	},
	{
		value: "Cítrica",
		label: "Cítricas",
		imageSrc: "/lemon.jpg",
		imageAlt: "Limão",
	},
	{
		value: "Frutas Vermelhas",
		label: "Frutas Vermelhas",
		imageSrc: "/strawberry.jpg",
		imageAlt: "Morango",
	},
	{
		value: "Frutas de caroço",
		label: "Frutas de caroço",
		imageSrc: "/mango.png",
		imageAlt: "Manga",
	},
	{
		value: "Frutas de Videira",
		label: "Frutas de Videira",
		imageSrc: "/grape.png",
		imageAlt: "Uva",
	},
	{
		value: "Exóticas",
		label: "Exóticas",
		imageSrc: "/acerola.png",
		imageAlt: "Acerola",
	},
	{
		value: "Outras",
		label: "Outras",
		imageSrc: "/lettuce.png",
		imageAlt: "Alface",
	},
];
