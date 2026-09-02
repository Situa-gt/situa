# Reporte: filtro de precio respetando moneda

## Verificación previa (solo lectura)

- Base: `main` en `11ad2c4`. Rama creada: `agent/moneda-filtro`.
- Supabase tiene 31 proyectos activos: 21 `GTQ` y 10 `USD`. Entre los 30 apartamentos hay 20 `GTQ` y 10 `USD`; BRISIA es la única casa activa y usa `GTQ`.
- `models.price_from` está expresado en la `base_currency` del proyecto. Ejemplos contrastados con producción: Ativo guarda 143,000 bajo USD y la tarjeta muestra `$143,000`; Khora guarda 898,420 bajo GTQ y la tarjeta muestra `Q898,420`.
- `models.monthly_payment_from` también sigue la `base_currency` del proyecto. Los 41 modelos USD con cuota tienen una razón cuota/precio promedio de 0.603%, y los 85 GTQ de 0.681%, magnitudes comparables. Ativo: 900 / 143,000 = 0.629% (USD); Zenika: 11,871.56 / 1,720,787.50 = 0.690% (GTQ). La cuota Q11,872 observada corresponde a Zenika, cuyo precio y cuota son ambos GTQ, no a la tarjeta USD de Ativo.
- `projects.exchange_rate` contiene 7.80 (28 proyectos), 7.68 (Nim), 7.79 (Metropolitan) y 7.82 (ZIMA). Significa GTQ por USD: los normalizadores de `src/lib/queries/home.ts` dividen los valores GTQ por la tasa. Ejemplo: Khora Q898,420 / 7.8 = USD115,182.05. La conversión inversa USD→GTQ multiplica por la tasa, como documenta `src/lib/format/price.ts`.
- `formatPriceFrom` y `formatPriceValue`, en `src/lib/format/price.ts`, eligen `$` o `Q` según el argumento `currency`. Las tarjetas de índice les pasan `project.base_currency`; la portada normaliza sus datos y fija `base_currency: 'USD'`.

## Cambio

`projectIdsMatchingModelFilters` ahora trae `price_from` junto con `projects.base_currency` y `projects.exchange_rate`, conserva el filtro de dormitorios en Supabase y compara los precios en USD en memoria. Esto es simple y suficientemente barato para 31 proyectos/pocos modelos, evita una migración y hace explícita la dirección de conversión.

Si un proyecto no USD tiene una tasa no finita o menor o igual a cero, el filtro aplica *fail open*: conserva ese proyecto candidato para no ocultarlo silenciosamente. El comentario correspondiente queda junto a la lógica.

## Resultados antes/después

| Búsqueda | Antes | Después |
|---|---:|---:|
| `/?precio_max=300000` | 7 | 27 |
| `/?precio_min=100000&precio_max=200000` | 5 | 23 |
| `/?precio_max=150000` | 2 | 18 |
| `/?precio_min=1000000` | 20 | 1 |
| `/` | 31 | 31 |
| `/?zona=zona-15` | 9 | 9 |

Después de `precio_max=300000` aparecen: ADN Apartamentos, Ahíra Apartamentos, Alana Apartamentos, ARTIS, Atarah Apartamentos, Ativo, Cetri, Inara Américas II, Inara Ciudad Vieja, Inara Santa Clara, Kaná, Khora, Latitud 14, Metropolitan, Minerva, Miró Apartamentos, Monet Apartamentos, Nim, Noa Apartamentos, Parque Vista Verde, Polanco Parque Boutique, RESIDENCE ONE, Sotobosque Parque Boutique, VICINIA LAS AMERICAS, VITA, Zenika San Isidro y ZIMA. De ellos, 20 están cotizados en GTQ y ahora entran tras convertir a USD.

`precio_min=1000000` devuelve únicamente Bravante, que sí tiene modelos USD desde un millón; ya no incluye masivamente proyectos GTQ por comparar sus montos nativos como dólares.

## Validación técnica

- `npm run build`: exitoso, incluida la comprobación TypeScript de Next.js.
- `npx tsc --noEmit`: exitoso.
- `npm run lint`: los mismos 11 errores y 12 advertencias preexistentes; ningún diagnóstico nuevo en `src/lib/filters/apply.ts`.
- Servidor de desarrollo apagado al terminar las pruebas.
- Sin escrituras ni migraciones en Supabase; sin publicación.
