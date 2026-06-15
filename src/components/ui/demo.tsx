import { useState, useEffect } from 'react';
import { productAPI } from '@/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Marquee } from '@/components/ui/3d-testimonails';

function ProductCard({ img, name, price, body, tag }: { img: string; name: string; price: string; body: string; tag: string }) {
  return (
    <Card className="w-56 rounded-2xl border border-border/70 bg-card/95 shadow-lg shadow-violet-500/10">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <Avatar className="size-12 border border-border/70">
            <AvatarImage src={img} alt={name} />
            <AvatarFallback>{name[0]}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="text-xs uppercase tracking-[0.25em] text-violet-400">{tag}</p>
            <figcaption className="text-sm font-semibold text-foreground">{name}</figcaption>
            <p className="text-xs text-muted-foreground">{price}</p>
          </div>
        </div>
        <blockquote className="mt-3 text-sm text-secondary-foreground">{body}</blockquote>
      </CardContent>
    </Card>
  );
}

export default function DemoOne() {
  const [products, setProducts] = useState<{ img: string; name: string; price: string; body: string; tag: string }[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await productAPI.getAll({ featured: 'true', limit: 10 });
        let data = res.data || [];
        if (data.length === 0) {
          const randomRes = await productAPI.getAll({ limit: 10 });
          data = randomRes.data || [];
        }
        const mapped = data.map(p => {
          const img = (p.images && p.images.length > 0 ? p.images[p.imagePrimaryIndex || 0] : p.image) || '/logo.png';
          const desc = typeof p.description === 'string' ? p.description : '';
          const body = desc.length > 80 ? desc.slice(0, 80) + '...' : desc || 'Premium quality product.';
          return {
            img,
            name: p.name,
            price: `$${Number(p.price).toFixed(2)}`,
            body,
            tag: p.category || 'Product',
          };
        });
        setProducts(mapped);
      } catch (e) {
        console.error('Failed to fetch spotlight products:', e);
      }
    };
    fetchProducts();
  }, []);

  if (products.length === 0) return null;

  return (
    <div className="relative flex h-105 w-full max-w-6xl items-center justify-center overflow-hidden rounded-3xl border border-border/70 bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.14),transparent_35%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.10),transparent_35%)]" />
      <div className="relative z-10 flex flex-row items-center gap-4 perspective-[350px]">
        <Marquee vertical pauseOnHover repeat={3} className="[--duration:35s]">
          {products.map((product) => <ProductCard key={product.name} {...product} />)}
        </Marquee>
        <Marquee vertical pauseOnHover reverse repeat={3} className="[--duration:35s]">
          {products.map((product) => <ProductCard key={`${product.name}-b`} {...product} />)}
        </Marquee>
        <Marquee vertical pauseOnHover repeat={3} className="[--duration:35s]">
          {products.map((product) => <ProductCard key={`${product.name}-c`} {...product} />)}
        </Marquee>
      </div>
    </div>
  );
}
