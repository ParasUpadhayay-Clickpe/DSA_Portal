import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import styles from "./ProductDetail.module.css";
import { MainLayout } from "@/layouts/MainLayout";
import { useAuth } from "@/hooks";
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

type ProductData = {
  id: string;
  name: string;
  category: string;
  imageUrl?: string;

  isPanIndia: boolean;
  negativeList?: {
    states?: string[];
    zipCodes?: string[];
  };

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

const PRODUCT_DB: Record<string, ProductData> = {
  muthoot: {
    id: "muthoot",
    name: "MFL Business Loan (EDI)",
    category: "Loans",
    imageUrl: "https://www.chittorgarh.net/images/ipo/muthoot-fincorp-logo.png",

    isPanIndia: false,
    negativeList: {
      states: ["Jammu and Kashmir", "North East"],
      zipCodes: [],
    },

    stats: {
      commission: "2.5%",
      potential: "₹15,000",
    },
    details: {
      benefits: {
        title: "Key Benefits",
        subtitle: "Why your customers will love this product.",
        items: [
          "Loan Amount: ₹50,000 to ₹3,00,000 based on eligibility.",
          "Flexible EDI Tenures: 104, 156, 234, or 313 days.",
          "NTC (New to Credit) customers are accepted.",
          "Daily repayment via Equated Daily Instalments helps manage cashflow.",
          "Fast disbursement for micro & small enterprises.",
        ],
      },
      sell: {
        title: "Target Audience",
        subtitle: "Focus on these customer segments to maximize conversion.",
        items: [
          "Self-Employed Individuals only (Salaried profiles are rejected).",
          "Business Vintage: Minimum 2 years (Incorporation date on Udyam).",
          "Shop owners with Stock Value of at least ₹3 Lakhs.",
          "Total family income per annum should be more than ₹1 Lakh.",
        ],
      },
      req: {
        title: "Eligibility Requirements",
        subtitle: "Ensure customers meet these criteria before applying.",
        items: [
          "Age: 21 to 60 Years.",
          "CIBIL Score: Minimum 650.",
          "Distance: Shop must be within 15-20 km of Home/Aadhaar address.",
          "Banking: Min 6 months statement (Savings/Current) with ₹15k/month credit.",
          "Bank Account: Must be Nationalised (SBI, ICICI, Kotak, etc.). Joint accounts not accepted.",
          "Udyam Aadhaar: Incorporation date must be at least 2 years old.",
          "Shop Board: Permanent board (Painted/Flex) is mandatory. Paper/Tape not allowed.",
        ],
      },
      tnc: {
        title: "Terms & Conditions",
        subtitle: "Please read these carefully before pitching.",
        items: {
          general: [
            "ROI up to 28% (Risk Based) and Processing Fee approx 3%.",
            "After DigiLocker, VKYC must be completed within 2 days or case is rejected.",
            "Stock Item must be seen during Video PD and value > ₹3 Lakhs.",
          ],
          dos: [
            "Ensure Applicant Name matches exactly on Aadhaar, PAN, and Shop Board.",
            "Verify Applicant Number on Truecaller (Must match Applicant or Business Name).",
            "Ensure Shop Board is hanged properly with nails and written in big fonts/paint.",
            "Home address (owned or rented) MUST match Aadhaar address.",
          ],
          donts: [
            "Do not login cases with Overdue amount > ₹5,000 in existing loans.",
            "No EMI bounces allowed in the last 3 months (Max 1 allowed in 6 months).",
            "Do not exceed 5 BL/PL enquiries in the last 30 days.",
            "Do not apply if HDFC Bank account (for EMI cases).",
          ],
        },
      },
      faq: {
        title: "Frequently Asked Questions",
        subtitle: "Common queries from agents and customers.",
        items: [
          {
            question: "What are the Shop Name Board rules?",
            answer:
              "The board must be painted on a wall or a permanent flex banner properly hanged. Paper prints, temporary banners, or tape are strictly NOT allowed and will lead to rejection.",
            imageUrls: ["/s8-6.jpg", "/s8-4.jpg"],
          },
          {
            question: "Is there a distance limit?",
            answer:
              "Yes, the Shop/Office address must be within 20 km of the customer's Home/Aadhaar address.",
          },
          {
            question: "What are the banking bounce rules?",
            answer:
              "No EMI bounces in the last 90 days. Max 1 EMI bounce in last 6 months. Inward cheque returns should not exceed 3 in 180 days.",
          },
        ],
      },
    },
  },

  "savings-gold": {
    id: "savings-gold",
    name: "Gold Savings",
    category: "Savings",
    imageUrl: "https://cdn-icons-png.flaticon.com/512/2953/2953363.png",

    isPanIndia: true,

    stats: {
      commission: "₹500",
      potential: "₹2,000",
    },
    details: {
      benefits: {
        title: "Account Benefits",
        subtitle: "Premium features for gold members.",
        items: [
          "7.5% Interest Rate per annum.",
          "Zero Balance Account maintenance.",
          "Free Platinum Debit Card.",
        ],
      },
      sell: {
        title: "Who to pitch?",
        subtitle: "Ideal for salaried individuals.",
        items: [
          "Salaried employees with >50k income.",
          "Senior citizens looking for safety.",
        ],
      },
      req: {
        title: "Documents Required",
        subtitle: "Simple KYC process.",
        items: ["Aadhar Card", "PAN Card", "One passport size photo"],
      },
      tnc: {
        title: "Terms of Use",
        subtitle: "Banking policies apply.",
        items: {
          general: [
            "Interest is calculated daily and credited quarterly.",
            "Debit card charges apply after 1st year.",
          ],
          dos: [
            "Ensure signature matches PAN card.",
            "Use blue ink for forms.",
          ],
          donts: [
            "Don't accept overwriting on forms.",
            "Don't share customer OTP.",
          ],
        },
      },
      faq: {
        title: "FAQs",
        subtitle: "Help Center",
        items: [
          {
            question: "Is there a minimum balance?",
            answer: "No, this is a zero balance account for the first year.",
          },
        ],
      },
    },
  },
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
        <span className={styles.accordionIcon}>+</span>
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

  const [pincode, setPincode] = useState("");

  const [activeMainTab, setActiveMainTab] = useState<
    "details" | "customers" | "earnings"
  >("details");

  const [activeSubTab, setActiveSubTab] =
    useState<keyof ProductData["details"]>("benefits");

  const product = productId ? PRODUCT_DB[productId] : null;

  useEffect(() => {
    if (!isAuthenticated) navigate("/agent-login");
  }, [isAuthenticated, navigate]);

  const handleCheckEligibility = () => {
    if (!pincode) return;
    console.log(
      `Checking eligibility for product ${product?.id} in ${pincode}`
    );
    console.log(`Is Pan India: ${product?.isPanIndia}`);
  };

  if (!product) {
    return (
      <MainLayout>
        <div className={styles.pageContainer}>Product not found</div>
      </MainLayout>
    );
  }

  const renderDetailsContent = () => {
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
          </ul>
        )}
      </div>
    );
  };

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
              >
                Check
              </button>
            </div>
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
