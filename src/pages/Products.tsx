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

const PRODUCT_DATA = {
  loans: [
    {
      id: "muthoot",
      title: "MFL Business Loan (EDI)",
      sub: "Working Capital & Daily Repayment",
      metric: "24% – 28%",
      label: "Interest Rate (p.a.)",
      icon: <BriefcaseIcon className={styles.iconSvg} />,
      colorClass: "orange500",
      tag: "Popular",
    },
  ],
  savings: [
    {
      id: "savings-gold",
      title: "Gold Savings",
      sub: "High Interest Yield",
      metric: "7.5%",
      label: "APY",
      icon: <TrendingUpIcon className={styles.iconSvg} />,
      colorClass: "emerald500",
      tag: "Best Value",
    },
    {
      id: "savings-salary",
      title: "Salary Plus",
      sub: "Zero Balance Account",
      metric: "Free",
      label: "Maintenance",
      icon: <LandmarkIcon className={styles.iconSvg} />,
      colorClass: "teal500",
    },
  ],
  cards: [
    {
      id: "card-elite",
      title: "Elite World",
      sub: "Premium Lifestyle",
      metric: "5x",
      label: "Rewards",
      icon: <ShieldCheckIcon className={styles.iconSvg} />,
      colorClass: "indigo600",
      tag: "Premium",
    },
    {
      id: "card-travel",
      title: "JetSetter",
      sub: "0% Forex Fees",
      metric: "3%",
      label: "Cashback",
      icon: <BriefcaseIcon className={styles.iconSvg} />,
      colorClass: "sky600",
    },
    {
      id: "card-shop",
      title: "Shopper's Edge",
      sub: "Retail Benefits",
      metric: "Flat 2%",
      label: "Discount",
      icon: <UserPlusIcon className={styles.iconSvg} />,
      colorClass: "blue600",
    },
  ],
};

const Card = ({ data }: { data: any }) => {
  const iconBgClass = styles[data.colorClass] || styles.blue600;

  return (
    <div className={styles.cardWrapper}>
      <div className={styles.card}>
        <div className={styles.cardOverlay} />

        <div className={styles.cardHeader}>
          <div className={`${styles.iconBox} ${iconBgClass}`}>{data.icon}</div>

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

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/agent-login");
    }
  }, [isAuthenticated, navigate]);

  const handleCheck = () => {
    if (!zipCode) return;
    console.log("Filtering for:", zipCode);
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
              <button className={styles.checkBtn} onClick={handleCheck}>
                Check
              </button>
            </div>
          </div>
        </div>

        <div className={styles.whiteContainer}>
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Loans</h2>
              <div className={`${styles.divider} ${styles.dividerBlue}`}></div>
            </div>
            <div className={styles.grid}>
              {PRODUCT_DATA.loans.map((item) => (
                <Card key={item.id} data={item} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Saving Accounts</h2>
              <div className={`${styles.divider} ${styles.dividerBlue}`}></div>
            </div>
            <div className={styles.grid}>
              {PRODUCT_DATA.savings.map((item) => (
                <Card key={item.id} data={item} />
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Credit Cards</h2>
              <div className={`${styles.divider} ${styles.dividerBlue}`}></div>
            </div>
            <div className={styles.grid}>
              {PRODUCT_DATA.cards.map((item) => (
                <Card key={item.id} data={item} />
              ))}
            </div>
          </section>
        </div>
      </div>
    </MainLayout>
  );
};
