import React, { useState, useEffect } from 'react';
import { Input, Button } from '@/components/common';
import { agentApi } from '@/api';
import type { AgentDetails } from '@/types/agent.types';
import styles from './Profile.module.css';

export const Profile: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [originalData, setOriginalData] = useState<AgentDetails | null>(null);

    const [agentData, setAgentData] = useState<Partial<AgentDetails>>({
    });

    useEffect(() => {
        fetchAgentDetails();
    }, []);

    const fetchAgentDetails = async () => {
        setIsLoading(true);
        setError('');

        try {
            const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
            if (!agentId) {
                setError('Agent ID not found');
                setIsLoading(false);
                return;
            }

            const response = await agentApi.getAgentDetails({
                query_type: 'get_agent_details',
                agent_id: agentId,
            });

            // Check for both 'Success' status and 'Success' message
            const isSuccess = (response.status === 'Success' || response.message === 'Success')
                && response.response
                && Array.isArray(response.response)
                && response.response.length > 0;

            if (isSuccess) {
                const data = response.response[0];

                // Preserve actual values - use nullish coalescing to only convert null/undefined
                // This preserves empty strings and actual values like "Saurabh"
                const normalizedData: Partial<AgentDetails> = {
                    agent_id: String(data.agent_id ?? ''),
                    fname: String(data.fname ?? ''),
                    mname: data.mname ? String(data.mname) : '',
                    lname: String(data.lname ?? ''),
                    email: String(data.email ?? ''),
                    mob_num: typeof data.mob_num === 'number' ? data.mob_num : (data.mob_num ? Number(data.mob_num) : 0),
                    dob: data.dob ? String(data.dob) : '',
                    gender: data.gender ? String(data.gender) : '',
                    home_address1: data.home_address1 ? String(data.home_address1) : '',
                    home_address2: data.home_address2 ? String(data.home_address2) : '',
                    home_district: data.home_district ? String(data.home_district) : '',
                    home_state: data.home_state ? String(data.home_state) : '',
                    home_pin_code: data.home_pin_code ? String(data.home_pin_code) : '',
                    office_address1: data.office_address1 ? String(data.office_address1) : '',
                    office_address2: data.office_address2 ? String(data.office_address2) : '',
                    office_district: data.office_district ? String(data.office_district) : '',
                    office_state: data.office_state ? String(data.office_state) : '',
                    office_pin_code: data.office_pin_code ? String(data.office_pin_code) : '',
                    pan: data.pan ? String(data.pan) : '',
                    ifsc: data.ifsc ? String(data.ifsc) : '',
                    acc_num: data.acc_num ? String(data.acc_num) : '',
                    beneficiary_name: data.beneficiary_name ? String(data.beneficiary_name) : '',
                    fos_or_dsa: data.fos_or_dsa ? String(data.fos_or_dsa) : '',
                    contract_or_commission: data.contract_or_commission ? String(data.contract_or_commission) : '',
                };

                setAgentData(normalizedData);
                setOriginalData(normalizedData as AgentDetails);
            } else {
                const errorMsg = response.message || response.status || 'Failed to fetch agent details';
                setError(`Failed to load profile: ${errorMsg}. Response: ${JSON.stringify(response)}`);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch agent details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (field: keyof AgentDetails, value: string | undefined) => {
        setAgentData((prev) => {
            // Handle mob_num separately since it's a number
            if (field === 'mob_num') {
                return {
                    ...prev,
                    mob_num: value ? Number(value) : undefined,
                };
            }
            // Keep empty strings as empty strings for display, convert to undefined only when saving
            return {
                ...prev,
                [field]: value === undefined ? '' : value,
            };
        });
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            const agentId = localStorage.getItem('agent_id') || localStorage.getItem('agentId');
            if (!agentId) {
                setError('Agent ID not found');
                return;
            }

            // Convert empty strings to undefined for API, keep actual values
            const updateData = {
                agent_id: agentId,
                fname: agentData.fname || undefined,
                mname: agentData.mname && agentData.mname !== '' ? agentData.mname : undefined,
                lname: agentData.lname && agentData.lname !== '' ? agentData.lname : undefined,
                email: agentData.email || undefined,
                mob_num: agentData.mob_num ? Number(agentData.mob_num) : undefined,
                dob: agentData.dob && agentData.dob !== '' ? agentData.dob : undefined,
                gender: agentData.gender && agentData.gender !== '' ? agentData.gender : undefined,
                home_address1: agentData.home_address1 && agentData.home_address1 !== '' ? agentData.home_address1 : undefined,
                home_address2: agentData.home_address2 && agentData.home_address2 !== '' ? agentData.home_address2 : undefined,
                home_district: agentData.home_district && agentData.home_district !== '' ? agentData.home_district : undefined,
                home_state: agentData.home_state && agentData.home_state !== '' ? agentData.home_state : undefined,
                home_pin_code: agentData.home_pin_code && agentData.home_pin_code !== '' ? agentData.home_pin_code : undefined,
                office_address1: agentData.office_address1 && agentData.office_address1 !== '' ? agentData.office_address1 : undefined,
                office_address2: agentData.office_address2 && agentData.office_address2 !== '' ? agentData.office_address2 : undefined,
                office_district: agentData.office_district && agentData.office_district !== '' ? agentData.office_district : undefined,
                office_state: agentData.office_state && agentData.office_state !== '' ? agentData.office_state : undefined,
                office_pin_code: agentData.office_pin_code && agentData.office_pin_code !== '' ? agentData.office_pin_code : undefined,
                pan: agentData.pan && agentData.pan !== '' ? agentData.pan : undefined,
                ifsc: agentData.ifsc && agentData.ifsc !== '' ? agentData.ifsc : undefined,
                acc_num: agentData.acc_num && agentData.acc_num !== '' ? agentData.acc_num : undefined,
                beneficiary_name: agentData.beneficiary_name && agentData.beneficiary_name !== '' ? agentData.beneficiary_name : undefined,
                fos_or_dsa: agentData.fos_or_dsa && agentData.fos_or_dsa !== '' ? agentData.fos_or_dsa : undefined,
                contract_or_commission: agentData.contract_or_commission && agentData.contract_or_commission !== '' ? agentData.contract_or_commission : undefined,
            };

            const response = await agentApi.updateAgent(updateData);

            if (response.status === 'Success') {
                setError(''); // Clear any previous errors
                setSuccess('Profile updated successfully!');
                setIsEditing(false);
                // Refresh data to get updated values
                await fetchAgentDetails();
            } else {
                setSuccess(''); // Clear any previous success
                setError(response.message || 'Failed to update profile');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        setError('');
        setSuccess('');
        // Reset to original data
        if (originalData) {
            setAgentData(originalData);
        }
    };

    const getFullName = () => {
        const name = [agentData.fname, agentData.mname, agentData.lname]
            .filter(Boolean)
            .join(' ')
            .trim();
        return name || agentData.email || 'Agent';
    };

    const getInitials = () => {
        const name = getFullName();
        if (name === 'Agent' && agentData.email) {
            return agentData.email.substring(0, 2).toUpperCase();
        }
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2) || 'AG';
    };

    if (isLoading) {
        return (
            <div className={styles.profileContainer}>
                <div className={styles.profileCard}>
                    <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {getInitials()}
                        </div>
                        <div className={styles.nameSection}>
                            <h2 className={styles.fullName}>{getFullName()}</h2>
                            <p className={styles.agentId}>Agent ID: {agentData.agent_id || 'N/A'}</p>
                        </div>
                    </div>
                    {!isEditing && (
                        <Button
                            variant="primary"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </Button>
                    )}
                </div>

                {error && <div className={styles.errorMessage}>{error}</div>}
                {success && <div className={styles.successMessage}>{success}</div>}

                <div className={styles.profileContent}>
                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Personal Information</h3>
                        <div className={styles.formGrid}>
                            <Input
                                label="First Name"
                                type="text"
                                value={agentData.fname || ''}
                                onChange={(value) => handleInputChange('fname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Middle Name"
                                type="text"
                                value={agentData.mname || ''}
                                onChange={(value) => handleInputChange('mname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                value={agentData.lname || ''}
                                onChange={(value) => handleInputChange('lname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={agentData.email || ''}
                                onChange={(value) => handleInputChange('email', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Mobile Number"
                                type="tel"
                                value={String(agentData.mob_num || '')}
                                onChange={(value) => handleInputChange('mob_num', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={agentData.dob || ''}
                                onChange={(value) => handleInputChange('dob', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <div className={styles.selectWrapper}>
                                <label className={styles.label}>Gender</label>
                                <select
                                    className={styles.select}
                                    value={agentData.gender || ''}
                                    onChange={(e) => handleInputChange('gender', e.target.value || undefined)}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Home Address</h3>
                        <div className={styles.formGrid}>
                            <Input
                                label="Address Line 1"
                                type="text"
                                value={agentData.home_address1 || ''}
                                onChange={(value) => handleInputChange('home_address1', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Address Line 2"
                                type="text"
                                value={agentData.home_address2 || ''}
                                onChange={(value) => handleInputChange('home_address2', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="District"
                                type="text"
                                value={agentData.home_district || ''}
                                onChange={(value) => handleInputChange('home_district', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="State"
                                type="text"
                                value={agentData.home_state || ''}
                                onChange={(value) => handleInputChange('home_state', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="PIN Code"
                                type="text"
                                value={agentData.home_pin_code || ''}
                                onChange={(value) => handleInputChange('home_pin_code', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Office Address</h3>
                        <div className={styles.formGrid}>
                            <Input
                                label="Address Line 1"
                                type="text"
                                value={agentData.office_address1 || ''}
                                onChange={(value) => handleInputChange('office_address1', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Address Line 2"
                                type="text"
                                value={agentData.office_address2 || ''}
                                onChange={(value) => handleInputChange('office_address2', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="District"
                                type="text"
                                value={agentData.office_district || ''}
                                onChange={(value) => handleInputChange('office_district', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="State"
                                type="text"
                                value={agentData.office_state || ''}
                                onChange={(value) => handleInputChange('office_state', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="PIN Code"
                                type="text"
                                value={agentData.office_pin_code || ''}
                                onChange={(value) => handleInputChange('office_pin_code', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Bank Details</h3>
                        <div className={styles.formGrid}>
                            <Input
                                label="PAN Number"
                                type="text"
                                value={agentData.pan || ''}
                                onChange={(value) => handleInputChange('pan', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="IFSC Code"
                                type="text"
                                value={agentData.ifsc || ''}
                                onChange={(value) => handleInputChange('ifsc', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Account Number"
                                type="text"
                                value={agentData.acc_num || ''}
                                onChange={(value) => handleInputChange('acc_num', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Beneficiary Name"
                                type="text"
                                value={agentData.beneficiary_name || ''}
                                onChange={(value) => handleInputChange('beneficiary_name', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3 className={styles.sectionTitle}>Other Information</h3>
                        <div className={styles.formGrid}>
                            <div className={styles.selectWrapper}>
                                <label className={styles.label}>FOS or DSA</label>
                                <select
                                    className={styles.select}
                                    value={agentData.fos_or_dsa || ''}
                                    onChange={(e) => handleInputChange('fos_or_dsa', e.target.value || undefined)}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Type</option>
                                    <option value="FOS">FOS</option>
                                    <option value="DSA">DSA</option>
                                </select>
                            </div>
                            <div className={styles.selectWrapper}>
                                <label className={styles.label}>Contract or Commission</label>
                                <select
                                    className={styles.select}
                                    value={agentData.contract_or_commission || ''}
                                    onChange={(e) => handleInputChange('contract_or_commission', e.target.value || undefined)}
                                    disabled={!isEditing}
                                >
                                    <option value="">Select Type</option>
                                    <option value="Contract">Contract</option>
                                    <option value="Commission">Commission</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {isEditing && (
                        <div className={styles.actionButtons}>
                            <Button
                                variant="outline"
                                onClick={handleCancel}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                loading={isSaving}
                            >
                                Save Changes
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

