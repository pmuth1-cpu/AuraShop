import { useState, useEffect } from 'react';
import { productAPI } from '@/api';
import { Card, CardContent } from '@/components/ui/card';

function ProductCard({ img, name }: { img: string; name: string }) {
  return (
    <Card className="w-40 shrink-0 rounded-xl border border-border/60 bg-card/90 shadow-md shadow-violet-500/10 overflow-hidden">
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

  const col1 = products.filter((_, idx) => idx % 5 === 0);
  const col2 = products.filter((_, idx) => idx % 5 === 1);
  const col3 = products.filter((_, idx) => idx % 5 === 2);
  const col4 = products.filter((_, idx) => idx % 5 === 3);
  const col5 = products.filter((_, idx) => idx % 5 === 4);

  return (
    <>
      <style>{`
        @keyframes marquee-up {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .marquee-col {
          overflow: hidden;
          height: 420px;
          mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%);
        }
        .marquee-track {
          animation: marquee-up 28s linear infinite;
        }
        .marquee-col:hover .marquee-track {
          animation-play-state: paused;
        }
      `}</style>
      <div className="relative flex h-[450px] w-full max-w-7xl items-center justify-center overflow-hidden rounded-3xl border border-border/70 bg-background">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.18),transparent_40%),radial-gradient(circle_at_bottom,rgba(56,189,248,0.12),transparent_40%)]" />
        <div className="relative z-10 flex flex-row items-stretch gap-3">
          {[col1, col2, col3, col4, col5].map((col, i) => (
            <div key={i} className="marquee-col">
              <div className="marquee-track flex flex-col gap-3" style={{ animationDirection: i % 2 === 0 ? 'reverse' : 'normal' } as React.CSSProperties}>
                {[...col, ...col].map((product, idx) => (
                  <ProductCard key={`${product.name}-${i}-${idx}`} img={product.img} name={product.name} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
