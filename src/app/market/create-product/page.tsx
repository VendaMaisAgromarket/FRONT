'use client';

import { getAddresses } from '@/actions/address';
import { readProductById } from '@/actions/product';
import { getAllSellingUnits } from '@/actions/sellingUnit';
import { createProductSchema, CreateProductSchemaType } from '@/lib/schemas';
import { newProductFormSteps } from '@/utils/data';
import { moneyMask } from '@/utils/functions';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import CreateProductForm from './components/createProductForm';

export default function CadastrarProduto() {
	const [formPosition, setFormPosition] = useState<number>(0);
	const [hasNoAddress, setHasNoAddress] = useState(false);
	const searchParams = useSearchParams();
	const productId = searchParams.get('retrieveDataFrom');
	const form = useForm<CreateProductSchemaType>({
		resolver: zodResolver(createProductSchema),
		defaultValues: {
			name: '',
			variety: '',
			category: '',
			amount: '',
			description: '',
			sellingUnits: [],
			images: [],
			isNegotiable: false,
			harvestAt: new Date(),
		},
	});
	useEffect(() => {
		getAddresses().then((addresses) => setHasNoAddress(addresses.length === 0));
	}, []);

	// Novo cadastro já inicia com uma unidade de venda em quilogramas
	useEffect(() => {
		if (productId) return;

		getAllSellingUnits().then(
			(units: { id: string; unit: string; title: string }[]) => {
				const kg = units.find((u) => u.unit.toLowerCase() === 'kg');
				if (!kg || form.getValues('sellingUnits').length) return;

				form.setValue('sellingUnits', [
					{ unitId: kg.id, minPrice: '', acronym: kg.unit },
				]);
			}
		);
	}, [productId, form]);

	useEffect(() => {
		async function fetchAndSetProductData() {
			if (productId) {
				try {
					const data = await readProductById(productId);

					const newDefaultValues = {
						name: data.name,
						category: data.category,
						amount: data.stock.toString(),
						description: data.description,
						sellingUnits: data.sellingUnitProduct.map(
							(su: {
								minPrice: number;
								unitId: string;
								unit: { unit: string };
							}) => {
								return {
									minPrice: moneyMask(su.minPrice),
									unitId: su.unitId,
									acronym: su.unit.unit,
								};
							}
						),
						images: [],
						isNegotiable: data.isNegotiable,
						harvestAt: new Date(data.harvestAt),
						createdAt: data.createdAt,
						variety: data.variety,
					};

					form.reset(newDefaultValues);
				} catch (error) {
					console.log(error);
					toast.error(
						'Erro ao recuperar as informações do produto a ser duplicado. Por favor tente novamente.'
					);
				}
			}
		}

		fetchAndSetProductData();
	}, [productId, form]);

	return (
		<section className="max-w-7xl mx-auto p-6">
			<header className="space-y-1 mb-6">
				<h1 className="text-2xl font-bold">
					{form.getValues('name')
						? form.getValues('name')
						: 'Cadastrar produto'}
				</h1>
				<p className="text-gray-600">
					{newProductFormSteps[formPosition].description}
				</p>
				<p>
					Passo {formPosition + 1} de {newProductFormSteps.length}
				</p>
			</header>

			{hasNoAddress ? (
				<div className="max-w-2xl mx-auto flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center">
					<div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
						<AlertCircle className="h-7 w-7 text-red-600" />
					</div>
					<div className="space-y-1">
						<h2 className="text-lg font-semibold text-red-700">
							Endereço obrigatório
						</h2>
						<p className="text-sm text-red-600">
							Você precisa cadastrar um endereço antes de anunciar produtos.
							O endereço é utilizado para que os compradores possam retirar
							ou receber seus pedidos.
						</p>
					</div>
					<Link
						href="/market/profile/personal-info/addresses/new-address?redirect=/market/create-product"
						className="inline-flex items-center gap-2 rounded-md bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
					>
						Cadastrar endereço
					</Link>
				</div>
			) : (
				<CreateProductForm
					form={form}
					formPosition={formPosition}
					setFormPosition={setFormPosition}
					steps={newProductFormSteps}
				/>
			)}
		</section>
	);
}
