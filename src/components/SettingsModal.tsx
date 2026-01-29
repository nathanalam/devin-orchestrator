import React, { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';
import { api } from '../services/api';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
    const [devinToken, setDevinToken] = useState('');

    useEffect(() => {
        if (isOpen) {
            setDevinToken(api.getDevinToken() || '');
        }
    }, [isOpen]);

    const handleSave = () => {
        api.setDevinToken(devinToken);
        onClose();
        // Optional: Trigger a reload or context update if needed, but for now just saving to local storage is enough
        // as the api.devin calls read directly from localStorage each time.
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div className="glass-card" style={{
                width: '100%',
                maxWidth: '480px',
                padding: '2rem',
                margin: '1rem',
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--color-border)',
                boxShadow: 'var(--shadow-xl)'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem'
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '700',
                        margin: 0
                    }}>
                        Settings
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--color-text-muted)',
                            cursor: 'pointer',
                            padding: '0.25rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{
                        display: 'block',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginBottom: '0.5rem',
                        color: 'var(--color-text-secondary)'
                    }}>
                        Devin API Key
                    </label>
                    <div style={{ position: 'relative' }}>
                        <Key
                            style={{
                                position: 'absolute',
                                left: '1rem',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                color: 'var(--color-text-muted)'
                            }}
                            size={18}
                        />
                        <input
                            type="password"
                            style={{ paddingLeft: '3rem', width: '100%' }}
                            placeholder="bun_..."
                            value={devinToken}
                            onChange={e => setDevinToken(e.target.value)}
                        />
                    </div>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '0.5rem'
                    }}>
                        This token is used to authenticate with the Devin API.
                        It is stored locally in your browser.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button onClick={onClose}>
                        Cancel
                    </button>
                    <button onClick={handleSave} className="primary">
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};
