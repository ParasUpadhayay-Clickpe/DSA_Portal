import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { userProfileApi, timelineApi } from '@/api';
import type { GetUserProfileDataResponse } from '@/types/userProfile.types';
import type { TimelineEvent, GetUserTimelineResponse } from '@/types/timeline.types';
import styles from './CustomerProfile.module.css';

type TabType = 'details' | 'timeline';

export const CustomerProfile: React.FC = () => {
    const { customerId } = useParams<{ customerId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('details');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Get lead from route state (passed from Leads page)
    const leadFromState = location.state?.lead;
    const [profileData, setProfileData] = useState<GetUserProfileDataResponse['response'] | null>(null);
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (customerId && isAuthenticated) {
            fetchCustomerProfile();
        }
    }, [customerId, isAuthenticated]);

    useEffect(() => {
        if (customerId && activeTab === 'timeline') {
            fetchTimeline();
        }
    }, [customerId, activeTab]);

    const fetchCustomerProfile = async () => {
        if (!customerId) return;

        setLoading(true);
        setError('');

        try {
            const response = await userProfileApi.getUserProfileData({
                query_type: 'user_details',
                user_id: customerId,
            });

            if (response.status === 'Success' && response.response) {
                setProfileData(response.response);
            } else {
                setError(response.message || 'Failed to fetch customer profile');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch customer profile');
        } finally {
            setLoading(false);
        }
    };

    const fetchTimeline = async () => {
        if (!customerId) return;

        try {
            const response = await timelineApi.getUserTimeline({
                query_name: 'cp_mfl_user_timeline',
                key: { user_id: customerId },
            });
            if (response.status === 'Success' && response.response?.timeline) {
                setTimeline(response.response.timeline);
            }
        } catch (err) {
            console.error('Failed to fetch timeline:', err);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add toast notification here
    };

    const getStatusColor = (status?: string) => {
        if (!status) return '#6b7280';
        const statusUpper = status.toUpperCase();
        if (statusUpper.includes('ACTIVE') || statusUpper.includes('APPROVED') || statusUpper.includes('SUCCESS')) {
            return '#10b981';
        }
        if (statusUpper.includes('REJECTED') || statusUpper.includes('FAILED')) {
            return '#ef4444';
        }
        if (statusUpper.includes('PENDING') || statusUpper.includes('REVIEW')) {
            return '#f59e0b';
        }
        return '#6b7280';
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading customer profile...</div>
                </div>
            </MainLayout>
        );
    }

    if (error && !profileData) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </MainLayout>
        );
    }

    const customer = profileData || leadFromState;
    if (!customer) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.error}>Customer data not found</div>
                </div>
            </MainLayout>
        );
    }

    const userName = profileData
        ? [profileData.fname, profileData.mname, profileData.lname].filter(Boolean).join(' ')
        : leadFromState
            ? [leadFromState.fname, leadFromState.mname, leadFromState.lname].filter(Boolean).join(' ')
            : 'Unknown';

    const userInitials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'CU';

    const status = leadFromState?.application_status || 'PENDING';

    return (
        <MainLayout>
            <div className={styles.container}>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/leads')}
                    title="Back to Leads"
                >
                    ← Back to Leads
                </button>
                <div className={styles.mainLayout}>
                    {/* Left Panel - Customer Information */}
                    <div className={styles.leftPanel}>
                        <div className={styles.customerCard}>
                            <div className={styles.profileSection}>
                                <div className={styles.avatar}>{userInitials}</div>
                                <div
                                    className={styles.statusBadge}
                                    style={{ backgroundColor: getStatusColor(status) }}
                                >
                                    {status}
                                </div>
                                <h2 className={styles.customerName}>{userName}</h2>
                                <div className={styles.customerId}>
                                    ID: {customerId}
                                    <button
                                        className={styles.copyButton}
                                        onClick={() => copyToClipboard(customerId || '')}
                                        title="Copy Customer ID"
                                    >
                                        📋
                                    </button>
                                </div>
                            </div>

                            <div className={styles.contactInfo}>
                                {profileData?.mob_num && (
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactIcon}>📞</span>
                                        <span>{profileData.mob_num}</span>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(String(profileData.mob_num))}
                                            title="Copy"
                                        >
                                            📋
                                        </button>
                                    </div>
                                )}
                                {profileData?.email && (
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactIcon}>✉️</span>
                                        <span>{profileData.email}</span>
                                        <button
                                            className={styles.copyButton}
                                            onClick={() => copyToClipboard(profileData.email || '')}
                                            title="Copy"
                                        >
                                            📋
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Customer Details */}
                    <div className={styles.rightPanel}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'details' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('details')}
                            >
                                Details
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'timeline' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('timeline')}
                            >
                                Timeline {timeline.length > 0 && `(${timeline.length})`}
                            </button>
                        </div>

                        <div className={styles.content}>
                            {activeTab === 'details' && (
                                <div className={styles.details}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>General Information</h2>
                                        <div className={styles.detailsGrid}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Name:</span>
                                                <span className={styles.detailValue}>{userName}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Customer ID:</span>
                                                <span className={styles.detailValue}>{customerId}</span>
                                            </div>
                                            {profileData?.pan_num && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>PAN Number:</span>
                                                    <span className={styles.detailValue}>{profileData.pan_num}</span>
                                                </div>
                                            )}
                                            {profileData?.dob && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Date of Birth:</span>
                                                    <span className={styles.detailValue}>
                                                        {new Date(profileData.dob).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            )}
                                            {profileData?.gender && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Gender:</span>
                                                    <span className={styles.detailValue}>{profileData.gender}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>Additional Information</h2>
                                        <div className={styles.detailsGrid}>
                                            {profileData?.occupation && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Occupation:</span>
                                                    <span className={styles.detailValue}>{profileData.occupation}</span>
                                                </div>
                                            )}
                                            {profileData?.education && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Education:</span>
                                                    <span className={styles.detailValue}>{profileData.education}</span>
                                                </div>
                                            )}
                                            {profileData?.income && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Income:</span>
                                                    <span className={styles.detailValue}>
                                                        ₹{profileData.income.toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {profileData?.work_experience && (
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Work Experience:</span>
                                                    <span className={styles.detailValue}>{profileData.work_experience}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {profileData?.locations?.home && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Home Address</h2>
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Address:</span>
                                                    <span className={styles.detailValue}>
                                                        {[
                                                            profileData.locations.home.address1,
                                                            profileData.locations.home.address2,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(', ')}
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>District:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.locations.home.district}
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>State:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.locations.home.state}
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>PIN Code:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.locations.home.pin_code}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {profileData?.primary_bank_account && (
                                        <div className={styles.section}>
                                            <h2 className={styles.sectionTitle}>Bank Information</h2>
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Account Number:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.primary_bank_account.account_number}
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>IFSC:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.primary_bank_account.ifsc}
                                                    </span>
                                                </div>
                                                <div className={styles.detailRow}>
                                                    <span className={styles.detailLabel}>Bank Name:</span>
                                                    <span className={styles.detailValue}>
                                                        {profileData.primary_bank_account.bank_name}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'timeline' && (
                                <div className={styles.timeline}>
                                    {timeline.length === 0 ? (
                                        <div className={styles.emptyState}>No timeline events found</div>
                                    ) : (
                                        <div className={styles.timelineList}>
                                            {timeline.map((event, index) => (
                                                <div key={index} className={styles.timelineEvent}>
                                                    <div className={styles.timelineDot} />
                                                    <div className={styles.timelineContent}>
                                                        <div className={styles.timelineHeader}>
                                                            <span className={styles.timelineEventType}>
                                                                {event.eventType}
                                                            </span>
                                                            <span className={styles.timelineDate}>
                                                                {new Date(event.loggedAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className={styles.timelineDescription}>
                                                            {event.eventDescription}
                                                        </div>
                                                        <div className={styles.timelineMeta}>
                                                            <span>Entity: {event.entityType}</span>
                                                            <span>Source: {event.sourceEntityID}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
};

