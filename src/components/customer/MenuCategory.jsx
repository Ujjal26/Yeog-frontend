import ProductCard from './ProductCard';
import './MenuCategory.css';

export default function MenuCategory({ category, items }) {
  return (
    <section className="menu-category" id={`category-${category.toLowerCase()}`}>
      <div className="category-header">
        <div className="category-line"></div>
        <h2 className="category-title">{category}</h2>
        <div className="category-line"></div>
      </div>

      <div className="category-grid">
        {items.map((item, index) => (
          <div key={item.id} className={`stagger-${(index % 6) + 1}`}>
            <ProductCard item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
