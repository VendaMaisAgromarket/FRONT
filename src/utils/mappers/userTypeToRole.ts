// O backend só aceita role: "producer" | "buyer" — não existe perfil
// "distribuidor" no sistema. Das categorias de negócio exibidas no
// cadastro, apenas "farmer" (Produtor Rural) vende; as demais
// (distributor, cooperative-or-partnership, wholesaler, supermarket) são
// perfis de quem compra.
export default function mapUserTypeToRole(
	userType:
		| 'distributor'
		| 'cooperative-or-partnership'
		| 'farmer'
		| 'wholesaler'
		| 'supermarket'
): 'producer' | 'buyer' {
	return userType === 'farmer' ? 'producer' : 'buyer';
}
