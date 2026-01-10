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
// Import the API instance
import { productsApi } from "@/api/products.api";
// Ideally, import these types from your @/types/products.types file
// But I will keep local interfaces compatible with the API response for this file to work standalone if needed
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

// Mapped type for Frontend UI
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

// Helper to assign icons/colors if backend doesn't provide them
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

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.cardOverlay} />

        <div className={styles.cardHeader}>
          <div className={`${styles.iconBox} ${iconBgClass}`}>
            {/* Use Backend Image if available, else fallback to Icon */}
            {data.imageUrl ? (
              <img
                src={data.imageUrl}
                alt={data.title}
                className="w-6 h-6 object-contain"
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

  // Helper to map backend data to frontend categories
  const categorizeProducts = (rawProducts: Product[]): ProductGroup => {
    const group: ProductGroup = { loans: [], savings: [], cards: [] };

    if (!Array.isArray(rawProducts)) return group;

    rawProducts.forEach((p, index) => {
      const styles = getProductStyle(p.category || "other", index);
      const uiProduct: UIProduct = {
        ...p,
        title: p.name,
        sub: p.lender,
        // Fallback to content fields or defaults
        metric: p.content?.metric || "N/A",
        label: p.content?.label || "Details",
        tag: p.content?.tag,
        colorClass: p.content?.colorClass || styles.color,
        icon: styles.icon,
      };

      // Normalize backend category to frontend keys
      const cat = (p.category || "").toLowerCase();
      if (cat.includes("loan")) group.loans.push(uiProduct);
      else if (cat.includes("saving")) group.savings.push(uiProduct);
      else if (cat.includes("card")) group.cards.push(uiProduct);
      else {
        // Default bucket for other categories
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

    // Using the API class instead of direct fetch
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

    // Using the API class for eligibility check
    const result = await productsApi.checkEligibility({ pincode: zipCode });

    if (result.status === "Success" && result.response) {
      // Backend returns an object with 'eligible_products' array
      const eligible = result.response.eligible_products || [];
      const grouped = categorizeProducts(eligible);
      setProducts(grouped);

      // Optional: Show message if no products found for this pin
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

        {error && (
          <div className="text-red-500 mb-4 px-6 font-medium">{error}</div>
        )}

        {loading ? (
          <div className="flex justify-center p-12">
            <div className="animate-pulse text-gray-500">
              Loading products...
            </div>
          </div>
        ) : (
          <div className={styles.whiteContainer}>
            {/* LOANS SECTION */}
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

            {/* SAVINGS SECTION */}
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

            {/* CARDS SECTION */}
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

            {/* Empty State */}
            {products.loans.length === 0 &&
              products.savings.length === 0 &&
              products.cards.length === 0 && (
                <div className="p-8 text-center text-gray-500 bg-gray-50 rounded-lg mx-6 mb-6">
                  <div className="text-xl mb-2">No products found</div>
                  <div className="text-sm">
                    Try checking a different ZIP code or clear the filter.
                  </div>
                  {zipCode && (
                    <button
                      onClick={() => {
                        setZipCode("");
                        fetchProducts();
                      }}
                      className="mt-4 text-blue-600 hover:underline"
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
