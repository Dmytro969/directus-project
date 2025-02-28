import ProductGrid from '@/components/ProductGrid';
import styles from '@/styles/Home.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Products</h1>
      <p className={styles.subtitle}>
        Our Premium Products
      </p>
      <ProductGrid />
    </main>
  );
}
