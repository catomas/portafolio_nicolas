import { useSiteData } from '../contexts/SiteDataContext';
import BrandMarquee from './BrandMarquee';

export default function BrandsSection() {
  const { brands } = useSiteData();

  if (brands.length === 0) return null;

  return (
    <section id="brands" className="px-6 py-16 max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-text-primary mb-10 text-center">
        Marcas
      </h2>

      <BrandMarquee brands={brands} />
    </section>
  );
}
