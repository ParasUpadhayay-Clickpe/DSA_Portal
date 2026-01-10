import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ProductDetail.module.css";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/hooks";
import { productsApi } from "@/api/products.api";
import { CoinsIcon, UserPlusIcon, ArrowRightIcon } from "@/components/icons";

type BaseContent = string[];
type FaqContent = { question: string; answer: string; imageUrls?: string[] }[];
type TncContent = {
  general: string[];
  dos: string[];
  donts: string[];
};

type SectionData = {
  title: string;
  subtitle: string;
  items: BaseContent | FaqContent | TncContent;
};

type UIProductData = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;
  isPanIndia: boolean;
  stats: {
    commission: string;
    potential: string;
  };
  details: {
    benefits: SectionData;
    sell: SectionData;
    req: SectionData;
    tnc: SectionData;
    faq: SectionData;
  };
};

const CheckListItem = ({ text }: { text: string }) => (
  <li className={styles.gridItem}>
    <div className={styles.checkIcon}>✓</div>
    <span className={styles.listText}>{text}</span>
  </li>
);

const AccordionItem = ({
  question,
  answer,
  imageUrls,
}: {
  question: string;
  answer: string;
  imageUrls?: string[];
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className={styles.accordionItem} data-open={isOpen}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.accordionHeader}
      >
        {question}
        <span className={styles.accordionIcon}>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className={styles.accordionBody}>
          <p>{answer}</p>
          {imageUrls && imageUrls.length > 0 && (
            <div className={styles.faqImagesWrapper}>
              {imageUrls.map((url, index) => (
                <div key={index} className={styles.faqImageContainer}>
                  <img
                    src={url}
                    alt={`FAQ Visual ${index + 1}`}
                    className={styles.faqImage}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const ProductDetail: React.FC = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [product, setProduct] = useState<UIProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pincode, setPincode] = useState("");
  const [checkingEligibility, setCheckingEligibility] = useState(false);
  const [eligibilityMsg, setEligibilityMsg] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const [activeMainTab, setActiveMainTab] = useState<
    "details" | "customers" | "earnings"
  >("details");

  const [activeSubTab, setActiveSubTab] =
    useState<keyof UIProductData["details"]>("benefits");

  useEffect(() => {
    if (!isAuthenticated) navigate("/agent-login");
  }, [isAuthenticated, navigate]);

  const transformApiProductToUI = (apiData: any): UIProductData => {
    const content = apiData.content || {};

    return {
      id: apiData.id,
      name: apiData.name,
      category: apiData.category,
      imageUrl: apiData.imageUrl,
      isPanIndia: apiData.isPanIndia,
      stats: {
        commission: apiData.metric || "N/A",
        potential: "Check App",
      },
      details: {
        benefits: {
          title: "Key Benefits",
          subtitle: "Why customers love this product",
          items: content.benefits || [],
        },
        sell: {
          title: "Target Audience",
          subtitle: "Who should you sell this to?",
          items: content.whomToSell || [],
        },
        req: {
          title: "Requirements",
          subtitle: "Mandatory conditions for approval",
          items: content.requirements || [],
        },
        tnc: {
          title: "Terms & Conditions",
          subtitle: "Important guidelines to follow",
          items: {
            general: content.terms || [],
            dos: content.dos || [],
            donts: content.donts || [],
          },
        },
        faq: {
          title: "Frequently Asked Questions",
          subtitle: "Common doubts clarified",
          items: (content.faq || []).map((f: any) => ({
            question: f.q,
            answer: f.a,
            imageUrls: f.imageUrls,
          })),
        },
      },
    };
  };

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;

    setLoading(true);
    setError("");

    try {
      const result = await productsApi.getProducts({ channel: "AGENT" });

      if (result.status === "Success" && Array.isArray(result.response)) {
        const foundProduct = result.response.find(
          (p: any) => p.id === productId
        );

        if (foundProduct) {
          const formatted = transformApiProductToUI(foundProduct);
          setProduct(formatted);
        } else {
          setError("Product not found in catalog.");
        }
      } else {
        setError(result.message || "Failed to fetch product details.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
  }, [fetchProductDetails]);

  const handleCheckEligibility = async () => {
    if (!pincode || pincode.length !== 6) return;

    setCheckingEligibility(true);
    setEligibilityMsg(null);

    const result = await productsApi.checkEligibility({ pincode });

    if (result.status === "Success" && result.response) {
      const eligibleProducts = result.response.eligible_products || [];
      const isEligible = eligibleProducts.some((p: any) => p.id === productId);

      if (isEligible) {
        setEligibilityMsg({
          type: "success",
          msg: "Service available in this pincode!",
        });
      } else {
        setEligibilityMsg({
          type: "error",
          msg: "Service NOT available in this area.",
        });
      }
    } else {
      setEligibilityMsg({
        type: "error",
        msg: result.message || "Check failed",
      });
    }
    setCheckingEligibility(false);
  };

  const renderDetailsContent = () => {
    if (!product) return null;
    const sectionData = product.details[activeSubTab];
    if (!sectionData) return null;

    return (
      <div className={styles.contentArea}>
        <h3 className={styles.contentTitle}>{sectionData.title}</h3>
        <p className={styles.contentDesc}>{sectionData.subtitle}</p>

        {activeSubTab === "faq" && (
          <div className={styles.accordionContainer}>
            {(sectionData.items as FaqContent).map((faq, idx) => (
              <AccordionItem
                key={idx}
                question={faq.question}
                answer={faq.answer}
                imageUrls={faq.imageUrls}
              />
            ))}
            {(sectionData.items as FaqContent).length === 0 && (
              <p className="text-gray-500">No FAQs available.</p>
            )}
          </div>
        )}

        {activeSubTab === "tnc" && (
          <>
            <ol className={styles.tncList}>
              {(sectionData.items as TncContent).general.map((item, idx) => (
                <li key={idx} className={styles.tncItem}>
                  <span className={styles.tncIndex}>{idx + 1}.</span>
                  <span>{item}</span>
                </li>
              ))}
            </ol>

            <div className={styles.dosDontGrid}>
              <div className={styles.ddColumn}>
                <div className={`${styles.ddHeader} ${styles.dosHeader}`}>
                  Do's
                </div>
                <div className={`${styles.ddCard} ${styles.dosCard}`}>
                  <ul className={styles.ddList}>
                    {(sectionData.items as TncContent).dos.map((item, idx) => (
                      <li key={idx} className={styles.ddItem}>
                        <span className={`${styles.ddIcon} ${styles.dosIcon}`}>
                          ✓
                        </span>
                        {item}
                      </li>
                    ))}
                    {(sectionData.items as TncContent).dos.length === 0 && (
                      <li className={styles.ddItem}>No specific Do's</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className={styles.ddColumn}>
                <div className={`${styles.ddHeader} ${styles.dontHeader}`}>
                  Don'ts
                </div>
                <div className={`${styles.ddCard} ${styles.dontCard}`}>
                  <ul className={styles.ddList}>
                    {(sectionData.items as TncContent).donts.map(
                      (item, idx) => (
                        <li key={idx} className={styles.ddItem}>
                          <span
                            className={`${styles.ddIcon} ${styles.dontIcon}`}
                          >
                            ✕
                          </span>
                          {item}
                        </li>
                      )
                    )}
                    {(sectionData.items as TncContent).donts.length === 0 && (
                      <li className={styles.ddItem}>No specific Don'ts</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {activeSubTab !== "faq" && activeSubTab !== "tnc" && (
          <ul className={styles.gridList}>
            {(sectionData.items as BaseContent).map((item, idx) => (
              <CheckListItem key={idx} text={item} />
            ))}
            {(sectionData.items as BaseContent).length === 0 && (
              <p className="text-gray-500">No information available.</p>
            )}
          </ul>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-pulse text-xl text-blue-900 font-semibold">
              Loading Details...
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !product) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>
          <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
            <div className="text-red-500 text-lg font-medium">
              {error || "Product not found"}
            </div>
            <button
              onClick={() => navigate("/products")}
              className={styles.backBtn}
            >
              Back to Products
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className={styles.pageContainer}>
        <div className={styles.topNav}>
          <button
            onClick={() => navigate("/products")}
            className={styles.backBtn}
          >
            <ArrowRightIcon size={14} className={styles.rotateIcon} />
            <span>Back to Products</span>
          </button>
        </div>

        <div className={styles.header}>
          <div className={styles.headerLeft}>
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={`${product.name} Logo`}
                className={styles.productLogo}
              />
            )}
            <div className={styles.headerText}>
              <span className={styles.categoryTag}>{product.category}</span>
              <h1 className={styles.title}>{product.name}</h1>
              <p className={styles.subtitle}>ID: {product.id}</p>
            </div>
          </div>

          <div className={styles.eligibilityWidget}>
            <label className={styles.checkLabel}>Check Eligibility</label>
            <div className={styles.checkInputGroup}>
              <input
                type="text"
                placeholder="Enter Pincode"
                className={styles.pincodeInput}
                value={pincode}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^\d*$/.test(val) && val.length <= 6) setPincode(val);
                }}
              />
              <button
                className={styles.checkBtn}
                onClick={handleCheckEligibility}
                disabled={checkingEligibility}
              >
                {checkingEligibility ? "..." : "Check"}
              </button>
            </div>
            {eligibilityMsg && (
              <div
                className={`text-xs mt-2 font-medium ${
                  eligibilityMsg.type === "success"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {eligibilityMsg.msg}
              </div>
            )}
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.modernCard}>
            <div className={styles.cardContent}>
              <h4>Commission Rate</h4>
              <div className={styles.cardValue}>{product.stats.commission}</div>
            </div>
            <div className={`${styles.cardIconBox} ${styles.blueBox}`}>
              <CoinsIcon size={32} />
            </div>
          </div>

          <div className={styles.modernCard}>
            <div className={styles.cardContent}>
              <h4>Avg. Earnings / Lead</h4>
              <div className={styles.cardValue}>{product.stats.potential}</div>
            </div>
            <div className={`${styles.cardIconBox} ${styles.greenBox}`}>
              <UserPlusIcon size={32} />
            </div>
          </div>
        </div>

        <div className={styles.tabsContainer}>
          <div className={styles.mainTabsHeader}>
            {["details", "customers", "earnings"].map((tab) => (
              <button
                key={tab}
                className={`${styles.tabBtn} ${
                  activeMainTab === tab ? styles.activeTab : ""
                }`}
                onClick={() => setActiveMainTab(tab as any)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className={styles.tabBody}>
            {activeMainTab === "details" && (
              <>
                <div className={styles.subTabsHeader}>
                  {[
                    { id: "benefits", label: "Benefits" },
                    { id: "sell", label: "Whom to Sell?" },
                    { id: "req", label: "Requirements" },
                    { id: "tnc", label: "T&C" },
                    { id: "faq", label: "FAQs" },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSubTab(sub.id as any)}
                      className={`${styles.subTabBtn} ${
                        activeSubTab === sub.id ? styles.activeSubTab : ""
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
                {renderDetailsContent()}
              </>
            )}

            {activeMainTab === "customers" && (
              <div className={styles.contentArea}>
                <h3 className={styles.contentTitle}>Associated Customers</h3>
                <p className={styles.contentDesc}>
                  List of customers who purchased {product.name} will appear
                  here.
                </p>
              </div>
            )}

            {activeMainTab === "earnings" && (
              <div className={styles.contentArea}>
                <h3 className={styles.contentTitle}>Earnings History</h3>
                <p className={styles.contentDesc}>
                  Your payout history for this specific product.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
