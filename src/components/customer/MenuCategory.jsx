import ProductCard from './ProductCard';
import './MenuCategory.css';

export default function MenuCategory({ category, items, viewOnly = false, onOpenDetails }) {
  if (!items || items.length === 0) return null;

  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');

  return (
    <section className="menu-category" id={`category-${categorySlug}`}>
      <div className="category-header">
        <div className="category-line"></div>
        <h2 className="category-title">{category}</h2>
        <span className="category-count-badge">{items.length}</span>
        <div className="category-line"></div>
      </div>

      <div className="category-grid">
        {items.map((item, index) => (
          <div key={item.id} className={`stagger-${(index % 6) + 1}`}>
            <ProductCard item={item} viewOnly={viewOnly} onOpenDetails={onOpenDetails} />
          </div>
        ))}
      </div>
    </section>
  );
}
