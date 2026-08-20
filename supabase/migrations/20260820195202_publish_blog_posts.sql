do $$
declare
  target_count integer;
begin
  select count(*) into target_count
  from public.blog_posts
  where slug = any (array[
    'comprar-apartamentos-ciudad-guatemala',
    'apartamentos-pequenos-guatemala',
    'inversion-inmobiliaria-guatemala',
    'apartamentos-renta-vs-compra-guatemala',
    'elegir-proyecto-inmobiliario-guatemala',
    'zonas-emergentes-apartamentos-guatemala',
    'financiamiento-apartamentos-guatemala',
    'apartamentos-lujo-guatemala',
    'generar-ingresos-apartamentos-renta-guatemala',
    'que-revisar-antes-comprar-apartamento-guatemala',
    'ventajas-apartamentos-preventa-guatemala',
    'situa-encontrar-apartamentos-guatemala'
  ]);

  if target_count <> 12 then
    raise exception 'Expected 12 blog posts before publishing, found %', target_count;
  end if;

  update public.blog_posts
  set
    is_published = true,
    published_at = coalesce(published_at, now())
  where slug = any (array[
    'comprar-apartamentos-ciudad-guatemala',
    'apartamentos-pequenos-guatemala',
    'inversion-inmobiliaria-guatemala',
    'apartamentos-renta-vs-compra-guatemala',
    'elegir-proyecto-inmobiliario-guatemala',
    'zonas-emergentes-apartamentos-guatemala',
    'financiamiento-apartamentos-guatemala',
    'apartamentos-lujo-guatemala',
    'generar-ingresos-apartamentos-renta-guatemala',
    'que-revisar-antes-comprar-apartamento-guatemala',
    'ventajas-apartamentos-preventa-guatemala',
    'situa-encontrar-apartamentos-guatemala'
  ]);
end
$$;
