import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { MainLayout } from '@/layouts/MainLayout';
import { notesApi, timelineApi, documentVerificationApi, userProfileApi } from '@/api';
import type { Loan } from '@/types/loans.types';
import type { LoanNote } from '@/types/notes.types';
import type { TimelineEvent } from '@/types/timeline.types';
import type { KYCDocument } from '@/types/documentVerification.types';
import styles from './LoanDetail.module.css';

type TabType = 'overview' | 'notes' | 'documents' | 'timeline' | 'analysis';

export const LoanDetail: React.FC = () => {
    const { loanId } = useParams<{ loanId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Get loan from route state (passed from Loans page)
    const loanFromState = location.state?.loan as Loan | undefined;
    const [loan, setLoan] = useState<Loan | null>(loanFromState || null);

    // Notes
    const [notes, setNotes] = useState<LoanNote[]>([]);
    const [newNote, setNewNote] = useState('');
    const [addingNote, setAddingNote] = useState(false);

    // Timeline
    const [timeline, setTimeline] = useState<TimelineEvent[]>([]);

    // Documents
    const [kycDocuments, setKycDocuments] = useState<KYCDocument[]>([]);
    const [analysisData, setAnalysisData] = useState<Record<string, unknown> | null>(null);
    const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'loading' | 'syncing' | 'success' | 'error'>('idle');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/agent-login');
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        // If we have loan from state, use it; otherwise show error
        if (!loanFromState && loanId) {
            setError('Loan data not found. Please navigate from the Loans page.');
            setLoading(false);
        } else if (loanFromState) {
            setLoan(loanFromState);
            setLoading(false);
        }
    }, [loanId, loanFromState]);

    useEffect(() => {
        if (loan && activeTab === 'notes') {
            fetchNotes();
        }
        if (loan && activeTab === 'timeline') {
            fetchTimeline();
        }
        if (loan && activeTab === 'documents') {
            fetchDocuments();
        }
        if (loan && activeTab === 'analysis') {
            fetchAnalysisData();
        }
    }, [loan, activeTab]);


    const fetchNotes = async () => {
        if (!loanId) return;

        try {
            const response = await notesApi.getLoanNotes({ loan_id: loanId });
            if (response.status === 'Success' && response.data) {
                setNotes(response.data.notes || []);
            }
        } catch (err) {
            console.error('Failed to fetch notes:', err);
        }
    };

    const fetchTimeline = async () => {
        if (!loan?.user_id) return;

        try {
            const response = await timelineApi.getUserTimeline({
                query_name: 'cp_mfl_user_timeline',
                key: { user_id: loan.user_id },
            });
            if (response.status === 'Success' && response.response) {
                setTimeline(response.response.timeline || []);
            }
        } catch (err) {
            console.error('Failed to fetch timeline:', err);
        }
    };

    const fetchDocuments = async () => {
        if (!loan?.user_id) return;

        try {
            const response = await documentVerificationApi.getKYCDocuments({ user_id: loan.user_id });
            if (response.status && response.data) {
                setKycDocuments(response.data.documents || []);
            }
        } catch (err) {
            console.error('Failed to fetch documents:', err);
        }
    };

    const fetchAnalysisData = async () => {
        if (!loan?.user_id) return;

        try {
            const response = await documentVerificationApi.getDocumentAnalysisData({
                user_id: loan.user_id,
                query_type: 'get',
            });
            if (response.status && response.data) {
                setAnalysisData(response.data.extracted_fields || null);
            }
        } catch (err) {
            console.error('Failed to fetch analysis data:', err);
        }
    };

    const handleAddNote = async () => {
        if (!loanId || !newNote.trim()) return;

        setAddingNote(true);
        try {
            const agentName = loan?.agent_name || 'Agent';
            const response = await notesApi.addLoanNote({
                loan_id: loanId,
                createdAt: new Date().toISOString(),
                createdBy: agentName,
                note: `<p>${newNote.replace(/\n/g, '<br>')}</p>`,
                userGroup: 'CP',
                tag: 'cp_mfl',
            });

            if (response.status) {
                setNewNote('');
                await fetchNotes();
            } else {
                setError(response.message || 'Failed to add note');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add note');
        } finally {
            setAddingNote(false);
        }
    };

    const handleSyncAnalysis = async () => {
        if (!loan?.user_id) return;

        setAnalysisStatus('syncing');
        try {
            // Request analysis
            const requestResponse = await documentVerificationApi.requestDocumentAnalysis({
                user_id: loan.user_id,
            });

            if (requestResponse.status && requestResponse.data) {
                const runId = requestResponse.data.run_id;

                // Poll for completion
                let pollCount = 0;
                const maxPolls = 15; // 30 seconds max (15 * 2 seconds)

                const pollInterval = setInterval(async () => {
                    pollCount++;
                    try {
                        const statusResponse = await documentVerificationApi.requestDocumentAnalysis({
                            user_id: loan.user_id,
                            run_id: runId,
                        });

                        if (statusResponse.data.status === 'SUCCESS' || statusResponse.data.status === 'COMPLETED') {
                            clearInterval(pollInterval);
                            setAnalysisStatus('success');
                            await fetchAnalysisData();
                        } else if (statusResponse.data.status === 'FAILED') {
                            clearInterval(pollInterval);
                            setAnalysisStatus('error');
                        } else if (pollCount >= maxPolls) {
                            clearInterval(pollInterval);
                            setAnalysisStatus('error');
                        }
                    } catch (err) {
                        clearInterval(pollInterval);
                        setAnalysisStatus('error');
                    }
                }, 2000);
            } else {
                setAnalysisStatus('error');
            }
        } catch (err) {
            setAnalysisStatus('error');
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    if (loading) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.loading}>Loading loan details...</div>
                </div>
            </MainLayout>
        );
    }

    if (error && !loan) {
        return (
            <MainLayout>
                <div className={styles.container}>
                    <div className={styles.error}>{error}</div>
                </div>
            </MainLayout>
        );
    }

    if (!loan) {
        return null;
    }

    const userName = [loan.fname, loan.mname, loan.lname].filter(Boolean).join(' ') || 'N/A';
    const userInitials = userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2) || 'NA';

    const getStatusColor = (status?: string) => {
        if (!status) return '#6b7280';
        const statusUpper = status.toUpperCase();
        if (statusUpper.includes('ACTIVE') || statusUpper.includes('SUCCESS')) return '#10b981';
        if (statusUpper.includes('REJECTED') || statusUpper.includes('FAILED')) return '#ef4444';
        if (statusUpper.includes('PENDING') || statusUpper.includes('REVIEW')) return '#f59e0b';
        return '#6b7280';
    };

    return (
        <MainLayout>
            <div className={styles.container}>
                <button
                    className={styles.backButton}
                    onClick={() => navigate('/loans')}
                    title="Back to Loans"
                >
                    ← Back to Loans
                </button>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <div className={styles.mainLayout}>
                    {/* Left Panel - Applicant Information */}
                    <div className={styles.leftPanel}>
                        <div className={styles.applicantCard}>
                            <div className={styles.profileSection}>
                                <div className={styles.avatar}>{userInitials}</div>
                                <div className={styles.applicantLabel}>ADDITIONAL_DOCUMENTS-POST_OFFER</div>
                                <h2 className={styles.applicantName}>{userName}</h2>
                            </div>

                            <div className={styles.contactInfo}>
                                {loan.mob_num && (
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactIcon}>📞</span>
                                        <span>{loan.mob_num}</span>
                                    </div>
                                )}
                                {loan.email && (
                                    <div className={styles.contactItem}>
                                        <span className={styles.contactIcon}>✉️</span>
                                        <span>{loan.email}</span>
                                    </div>
                                )}
                            </div>

                            <button
                                className={styles.syncDataButton}
                                onClick={handleSyncAnalysis}
                                disabled={analysisStatus === 'syncing'}
                            >
                                {analysisStatus === 'syncing' ? 'Syncing...' : 'Sync Data'}
                            </button>
                        </div>
                    </div>

                    {/* Right Panel - Loan Details */}
                    <div className={styles.rightPanel}>
                        <div className={styles.tabs}>
                            <button
                                className={`${styles.tab} ${activeTab === 'overview' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('overview')}
                            >
                                Loan Details
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'notes' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('notes')}
                            >
                                Notes {notes.length > 0 && `(${notes.length})`}
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'documents' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('documents')}
                            >
                                Documents {kycDocuments.length > 0 && `(${kycDocuments.length})`}
                            </button>
                            <button
                                className={`${styles.tab} ${activeTab === 'timeline' ? styles.activeTab : ''}`}
                                onClick={() => setActiveTab('timeline')}
                            >
                                Timeline {timeline.length > 0 && `(${timeline.length})`}
                            </button>
                        </div>

                        <div className={styles.content}>
                            {activeTab === 'overview' && (
                                <div className={styles.overview}>
                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>LOAN DETAILS</h2>
                                        <div className={styles.detailsGrid}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Loan Type:</span>
                                                <span className={styles.detailValue}>{loan.loan_type || '-'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Loan ID:</span>
                                                <span className={styles.detailValue}>{loan.loan_id}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Customer ID:</span>
                                                <span
                                                    className={`${styles.detailValue} ${styles.clickableLink}`}
                                                    onClick={() => {
                                                        // Could navigate to user profile if needed
                                                        console.log('Navigate to user:', loan.user_id);
                                                    }}
                                                >
                                                    {loan.user_id}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Created At:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.loan_created_at
                                                        ? new Date(loan.loan_created_at).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Updated At:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.loan_updated_at
                                                        ? new Date(loan.loan_updated_at).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Requested Loan Amount:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.requested_amt ? `₹${loan.requested_amt.toLocaleString('en-IN')}` : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Approved Loan Amount:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.lender_approved_amt ? `₹${loan.lender_approved_amt.toLocaleString('en-IN')}` : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Disbursed Loan Amount:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.disbursed_amt ? `₹${loan.disbursed_amt.toLocaleString('en-IN')}` : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Loan Disburse Date:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.disbursed_date
                                                        ? new Date(loan.disbursed_date).toLocaleDateString('en-GB', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })
                                                        : '-'}
                                                </span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Processing Fee:</span>
                                                <span className={styles.detailValue}>
                                                    {loan.loan_processing_fees_amt
                                                        ? `₹${loan.loan_processing_fees_amt.toLocaleString('en-IN')}`
                                                        : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className={styles.section}>
                                        <h2 className={styles.sectionTitle}>ADDITIONAL INFO</h2>
                                        <div className={styles.detailsGrid}>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>Agent ID:</span>
                                                <span className={styles.detailValue}>{loan.agent_id || '-'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>CIBIL Score:</span>
                                                <span className={styles.detailValue}>{loan.bureau_score || '-'}</span>
                                            </div>
                                            <div className={styles.detailRow}>
                                                <span className={styles.detailLabel}>CIBIL Status:</span>
                                                <span
                                                    className={styles.detailValue}
                                                    style={{
                                                        color: getStatusColor(loan.bureau_name || loan.is_active?.toString()),
                                                        fontWeight: 500
                                                    }}
                                                >
                                                    {loan.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className={styles.notes}>
                                    <div className={styles.addNoteSection}>
                                        <textarea
                                            className={styles.noteInput}
                                            placeholder="Add a note..."
                                            value={newNote}
                                            onChange={(e) => setNewNote(e.target.value)}
                                            rows={4}
                                        />
                                        <button
                                            className={styles.addNoteButton}
                                            onClick={handleAddNote}
                                            disabled={addingNote || !newNote.trim()}
                                        >
                                            {addingNote ? 'Adding...' : 'Add Note'}
                                        </button>
                                    </div>

                                    <div className={styles.notesList}>
                                        {notes.length === 0 ? (
                                            <div className={styles.emptyState}>No notes yet</div>
                                        ) : (
                                            notes.map((note) => (
                                                <div key={note.note_id} className={styles.noteCard}>
                                                    <div className={styles.noteHeader}>
                                                        <span className={styles.noteAuthor}>{note.createdBy}</span>
                                                        <span className={styles.noteDate}>
                                                            {new Date(note.createdAt).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div
                                                        className={styles.noteContent}
                                                        dangerouslySetInnerHTML={{ __html: note.note }}
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'documents' && (
                                <div className={styles.documents}>
                                    {kycDocuments.length === 0 ? (
                                        <div className={styles.emptyState}>No documents found</div>
                                    ) : (
                                        <div className={styles.documentsGrid}>
                                            {kycDocuments.map((doc) => (
                                                <div key={doc.document_id} className={styles.documentCard}>
                                                    <div className={styles.documentType}>{doc.document_type}</div>
                                                    <img
                                                        src={doc.document_url}
                                                        alt={doc.document_type}
                                                        className={styles.documentImage}
                                                        onError={(e) => {
                                                            (e.target as HTMLImageElement).style.display = 'none';
                                                        }}
                                                    />
                                                    <a
                                                        href={doc.document_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className={styles.documentLink}
                                                    >
                                                        View Document
                                                    </a>
                                                    <div className={styles.documentDate}>
                                                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                            ))}
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
                                                            <span className={styles.timelineEventType}>{event.eventType}</span>
                                                            <span className={styles.timelineDate}>
                                                                {new Date(event.loggedAt).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <div className={styles.timelineDescription}>{event.eventDescription}</div>
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

