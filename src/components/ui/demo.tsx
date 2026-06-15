import { useState, useEffect } from 'react';
import { productAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';

function ProductCard({ img, name }: { img: string; name: string }) {
  return (
    <Card className="w-40 rounded-xl border border-border/60 bg-card/90 shadow-md shadow-violet-500/10 overflow-hidden">
      <CardContent className="p-0">
        <div className="aspect-square w-full overflow-hidden bg-background">
          <img src={img} alt={name} className="h-full w-full object-cover" loading="lazy" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DemoOne() {
  const [products, setProducts] = useState<{ img: string; name: string }[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll({ featured: 'true', limit: 15 });
        let data = res.data || [];
        if (data.length === 0) {
          const randomRes = await productAPI.getAll({ limit: 15 });
          data = randomRes.data || [];
        }
        const mapped = data.map(p => {
          const img = (p.images && p.images.length > 0 ? p.images[p.imagePrimaryIndex || 0] : p.image) || '/logo.png';
          return { img, name: p.name };
        });
        setProducts(mapped);
      } catch (e) {
        console.error('Failed to fetch spotlight products:', e);
      }
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  const repeated = Array.from({ length: 5 }).flatMap((_, i) => products.map(p => ({ ...p, key: `${p.name}-${i}` })));

  return (
    <div className="relative flex h-105 w-full max-w-7xl items-center justify-center overflow-hidden rounded-3xl border border-border/70 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_40%)]" />
      <div className="relative z-10 flex flex-row items-center gap-3 perspective-[350px]">
        {Array.from({ length: 5 }).map((_, i) => (
          <Marquee vertical pauseOnHover repeat={3} className="[--duration:28s]" key={i}>
            {repeated.filter((_, idx) => idx % 5 === i).map(product => (
              <ProductCard key={product.key} img={product.img} name={product.name} />
            ))}
          </Marquee>
        ))}
      </div>
    </div>
  );
}
