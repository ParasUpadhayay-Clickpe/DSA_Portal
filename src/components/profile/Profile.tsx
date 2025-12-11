import React, { useState } from 'react';
import { Input, Button } from '@/components/common';
import styles from './Profile.module.css';

interface AgentDetails {
    agent_id: string;
    fname: string;
    mname: string;
    lname: string;
    email: string;
    mob_num: string;
    dob: string;
    gender: string;
    home_address1: string;
    home_address2: string;
    home_district: string;
    home_state: string;
    home_pin_code: string;
    office_address1: string;
    office_address2: string;
    office_district: string;
    office_state: string;
    office_pin_code: string;
    pan: string;
    ifsc: string;
    acc_num: string;
    beneficiary_name: string;
    fos_or_dsa: string;
    contract_or_commission: string;
}

export const Profile: React.FC = () => {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Mock agent data - will be replaced with API call
    const [agentData, setAgentData] = useState<AgentDetails>({
        agent_id: 'agent_123456',
        fname: 'John',
        mname: 'Middle',
        lname: 'Doe',
        email: 'agent@example.com',
        mob_num: '9876543210',
        dob: '1990-01-01',
        gender: 'Male',
        home_address1: '123 Main Street',
        home_address2: 'Apt 4B',
        home_district: 'Mumbai',
        home_state: 'Maharashtra',
        home_pin_code: '400001',
        office_address1: '456 Business Ave',
        office_address2: 'Floor 2',
        office_district: 'Mumbai',
        office_state: 'Maharashtra',
        office_pin_code: '400002',
        pan: 'ABCDE1234F',
        ifsc: 'BANK0001234',
        acc_num: '1234567890',
        beneficiary_name: 'John Doe',
        fos_or_dsa: 'DSA',
        contract_or_commission: 'Commission',
    });

    const handleInputChange = (field: keyof AgentDetails, value: string) => {
        setAgentData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        setError('');
        setSuccess('');

        try {
            // TODO: Replace with actual API call
            // await updateAgentDetails(agentData);

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1000));

            setSuccess('Profile updated successfully!');
            setIsEditing(false);
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
        // TODO: Reset to original data from API
    };

    const getFullName = () => {
        return `${agentData.fname} ${agentData.mname || ''} ${agentData.lname}`.trim();
    };

    return (
        <div className={styles.profileContainer}>
            <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                    <div className={styles.avatarSection}>
                        <div className={styles.avatar}>
                            {getFullName()
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .substring(0, 2)}
                        </div>
                        <div className={styles.nameSection}>
                            <h2 className={styles.fullName}>{getFullName()}</h2>
                            <p className={styles.agentId}>Agent ID: {agentData.agent_id}</p>
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
                                value={agentData.fname}
                                onChange={(value) => handleInputChange('fname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Middle Name"
                                type="text"
                                value={agentData.mname}
                                onChange={(value) => handleInputChange('mname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Last Name"
                                type="text"
                                value={agentData.lname}
                                onChange={(value) => handleInputChange('lname', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Email"
                                type="email"
                                value={agentData.email}
                                onChange={(value) => handleInputChange('email', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Mobile Number"
                                type="tel"
                                value={agentData.mob_num}
                                onChange={(value) => handleInputChange('mob_num', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Date of Birth"
                                type="date"
                                value={agentData.dob}
                                onChange={(value) => handleInputChange('dob', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <div className={styles.selectWrapper}>
                                <label className={styles.label}>Gender</label>
                                <select
                                    className={styles.select}
                                    value={agentData.gender}
                                    onChange={(e) => handleInputChange('gender', e.target.value)}
                                    disabled={!isEditing}
                                >
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
                                value={agentData.home_address1}
                                onChange={(value) => handleInputChange('home_address1', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Address Line 2"
                                type="text"
                                value={agentData.home_address2}
                                onChange={(value) => handleInputChange('home_address2', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="District"
                                type="text"
                                value={agentData.home_district}
                                onChange={(value) => handleInputChange('home_district', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="State"
                                type="text"
                                value={agentData.home_state}
                                onChange={(value) => handleInputChange('home_state', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="PIN Code"
                                type="text"
                                value={agentData.home_pin_code}
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
                                value={agentData.office_address1}
                                onChange={(value) => handleInputChange('office_address1', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Address Line 2"
                                type="text"
                                value={agentData.office_address2}
                                onChange={(value) => handleInputChange('office_address2', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="District"
                                type="text"
                                value={agentData.office_district}
                                onChange={(value) => handleInputChange('office_district', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="State"
                                type="text"
                                value={agentData.office_state}
                                onChange={(value) => handleInputChange('office_state', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="PIN Code"
                                type="text"
                                value={agentData.office_pin_code}
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
                                value={agentData.pan}
                                onChange={(value) => handleInputChange('pan', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="IFSC Code"
                                type="text"
                                value={agentData.ifsc}
                                onChange={(value) => handleInputChange('ifsc', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Account Number"
                                type="text"
                                value={agentData.acc_num}
                                onChange={(value) => handleInputChange('acc_num', value)}
                                disabled={!isEditing}
                                fullWidth
                            />
                            <Input
                                label="Beneficiary Name"
                                type="text"
                                value={agentData.beneficiary_name}
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
                                    value={agentData.fos_or_dsa}
                                    onChange={(e) => handleInputChange('fos_or_dsa', e.target.value)}
                                    disabled={!isEditing}
                                >
                                    <option value="FOS">FOS</option>
                                    <option value="DSA">DSA</option>
                                </select>
                            </div>
                            <div className={styles.selectWrapper}>
                                <label className={styles.label}>Contract or Commission</label>
                                <select
                                    className={styles.select}
                                    value={agentData.contract_or_commission}
                                    onChange={(e) => handleInputChange('contract_or_commission', e.target.value)}
                                    disabled={!isEditing}
                                >
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

