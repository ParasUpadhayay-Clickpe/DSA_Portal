import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Products.module.css";
import {
  ArrowRightIcon,
  BookmarkIcon,
  BriefcaseIcon,
  LandmarkIcon,
  ShareIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
  UserPlusIcon,
} from "@/components/icons";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/hooks";
import { productsApi } from "@/api/products.api";

interface ProductContent {
  metric?: string;
  label?: string;
  tag?: string;
  colorClass?: string;
  [key: string]: any;
}

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  lender: string;
  imageUrl?: string;
  status: string;
  isPanIndia: boolean;
  content?: ProductContent;
}

interface UIProduct extends Product {
  title: string;
  sub: string;
  icon: React.ReactNode;
  metric: string;
  label: string;
  colorClass: string;
  tag?: string;
}

interface ProductGroup {
  loans: UIProduct[];
  savings: UIProduct[];
  cards: UIProduct[];
}

const getProductStyle = (category: string, index: number) => {
  const colors = ["orange500", "emerald500", "indigo600", "sky600", "blue600"];
  const icons = [
    <BriefcaseIcon className={styles.iconSvg} key="brief" />,
    <TrendingUpIcon className={styles.iconSvg} key="trend" />,
    <ShieldCheckIcon className={styles.iconSvg} key="shield" />,
    <LandmarkIcon className={styles.iconSvg} key="land" />,
    <UserPlusIcon className={styles.iconSvg} key="user" />,
  ];
  return {
    color: colors[index % colors.length],
    icon: icons[index % icons.length],
  };
};

const Card = ({ data }: { data: UIProduct }) => {
  const iconBgClass = styles[data.colorClass] || styles.blue600;

  console.log(data);

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.cardOverlay} />

        <div className={styles.cardHeader}>
          <div className={`${styles.iconBox} ${iconBgClass}`}>
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={data.title}
                className={styles.cardImage}
              />
            ) : (
              data.icon
            )}
          </div>

          <div className={styles.headerActions}>
            {data.tag && <span className={styles.tag}>{data.tag}</span>}
            <button className={styles.shareBtn}>
              <ShareIcon size={20} />
            </button>
          </div>
        </div>

        <div className={styles.content}>
          <h3 className={styles.cardTitle}>{data.title}</h3>
          <p className={styles.cardSub}>{data.sub}</p>
        </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricLeft}>
            <div className={styles.metricValue}>
              <span className={styles.star}>★</span> {data.metric}
            </div>
            <div className={styles.metricLabel}>{data.label}</div>
          </div>
          <div className={styles.metricRight}>
            <div className={styles.metricValue}>0%</div>
            <div className={styles.metricLabel}>Hidden Fee</div>
          </div>
        </div>

        <div className={styles.footerActions}>
          <Link to={`/products/${data.id}`} className={styles.viewBtn}>
            View Details
            <ArrowRightIcon size={14} className={styles.arrowIcon} />
          </Link>
          <button className={styles.bookmarkBtn}>
            <BookmarkIcon size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [zipCode, setZipCode] = useState("");
  const [products, setProducts] = useState<ProductGroup>({
    loans: [],
    savings: [],
    cards: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const categorizeProducts = (rawProducts: Product[]): ProductGroup => {
    const group: ProductGroup = { loans: [], savings: [], cards: [] };

    if (!Array.isArray(rawProducts)) return group;

    rawProducts.forEach((p, index) => {
      const styles = getProductStyle(p.category || "other", index);
      const uiProduct: UIProduct = {
        ...p,
        title: p.name,
        sub: p.lender,
        metric: p.content?.metric || "N/A",
        label: p.content?.label || "Details",
        tag: p.content?.tag,
        colorClass: p.content?.colorClass || styles.color,
        icon: styles.icon,
      };

      const cat = (p.category || "").toLowerCase();
      if (cat.includes("loan")) group.loans.push(uiProduct);
      else if (cat.includes("saving")) group.savings.push(uiProduct);
      else if (cat.includes("card")) group.cards.push(uiProduct);
      else {
        group.cards.push(uiProduct);
      }
    });
    return group;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/agent-login");
      return;
    }
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, navigate]);

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    const result = await productsApi.getProducts({ channel: "AGENT" });

    if (result.status === "Success" && Array.isArray(result.response)) {
      const grouped = categorizeProducts(result.response);
      setProducts(grouped);
    } else {
      setError(result.message || "Failed to fetch products");
    }

    setLoading(false);
  };

  const handleCheck = async () => {
    if (!zipCode || zipCode.length !== 6) return;
    setLoading(true);
    setError("");

    const result = await productsApi.checkEligibility({ pincode: zipCode });

    if (result.status === "Success" && result.response) {
      const eligible = result.response.eligible_products || [];
      const grouped = categorizeProducts(eligible);
      setProducts(grouped);

      if (eligible.length === 0) {
        setError(`No eligible products found for pincode ${zipCode}`);
      }
    } else {
      setError(result.message || "Eligibility check failed");
    }

    setLoading(false);
  };

  if (!isAuthenticated) return null;

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.pageHeader}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Products</h1>
            <p className={styles.pageSubtitle}>
              Explore our range of innovative products
            </p>
          </div>

          <div className={styles.filterContainer}>
            <label className={styles.filterLabel}>
              Filter products based on customer ZIP code
            </label>
            <div className={styles.filterInputGroup}>
              <input
                type="text"
                className={styles.zipInput}
                placeholder="Enter 6-digit Zip"
                value={zipCode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setZipCode(val);
                }}
              />
              <button
                className={styles.checkBtn}
                onClick={handleCheck}
                disabled={loading}
              >
                {loading ? "..." : "Check"}
              </button>
            </div>
          </div>
        </div>

        {error && <div className={styles.errorMessage}>{error}</div>}

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingPulse}>Loading products...</div>
          </div>
        ) : (
          <div className={styles.whiteContainer}>
            {products.loans.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Loans</h2>
                  <div
                    className={`${styles.divider} ${styles.dividerBlue}`}
                  ></div>
                </div>
                <div className={styles.grid}>
                  {products.loans.map((item) => (
                    <Card key={item.id} data={item} />
                  ))}
                </div>
              </section>
            )}

            {products.savings.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Saving Accounts</h2>
                  <div
                    className={`${styles.divider} ${styles.dividerBlue}`}
                  ></div>
                </div>
                <div className={styles.grid}>
                  {products.savings.map((item) => (
                    <Card key={item.id} data={item} />
                  ))}
                </div>
              </section>
            )}

            {products.cards.length > 0 && (
              <section className={styles.section}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Credit Cards</h2>
                  <div
                    className={`${styles.divider} ${styles.dividerBlue}`}
                  ></div>
                </div>
                <div className={styles.grid}>
                  {products.cards.map((item) => (
                    <Card key={item.id} data={item} />
                  ))}
                </div>
              </section>
            )}

            {products.loans.length === 0 &&
              products.savings.length === 0 &&
              products.cards.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyTitle}>No products found</div>
                  <div className={styles.emptyDesc}>
                    Try checking a different ZIP code or clear the filter.
                  </div>
                  {zipCode && (
                    <button
                      onClick={() => {
                        setZipCode("");
                        fetchProducts();
                      }}
                      className={styles.clearFilterBtn}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
