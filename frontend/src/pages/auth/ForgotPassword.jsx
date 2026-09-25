import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../../utils/swalUtils';
import { API_BASE_URL } from '../../config/apiConfig';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Please enter your email address');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/auth/password-reset/`, {
                email: email,
            });

            setSent(true);
            showSuccessToast(
                'Email Sent!',
                'Check your inbox for a password reset link.'
            );
        } catch (err) {
            const message =
                err.response?.data?.email?.[0] ||
                err.response?.data?.detail ||
                'Something went wrong. Please try again.';
            setError(message);
            showErrorToast('Error', message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">

                {/* Logo mark */}
                <div className="auth-logo-mark">
                    <div className="logo-icon">🩸</div>
                    <span className="logo-text">HOPEDROP</span>
                </div>

                <div className="auth-header">
                    <h2>{sent ? 'Check Your Email' : 'Forgot Password'}</h2>
                    <p>
                        {sent
                            ? 'We sent a password reset link to your email'
                            : 'Enter your email and we\'ll send you a reset link'}
                    </p>
                </div>

                {error && <div className="auth-error-message">⚠️ {error}</div>}

                {sent ? (
                    /* Success state */
                    <div className="reset-success-box">
                        <div className="success-icon-wrapper">
                            <svg className="success-checkmark" viewBox="0 0 52 52">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <p className="reset-email-sent-to">
                            Sent to: <strong>{email}</strong>
                        </p>
                        <p className="reset-hint">
                            Didn&apos;t receive it? Check your spam folder or try again.
                        </p>
                        <button
                            className="auth-submit-btn reset-resend-btn"
                            onClick={() => { setSent(false); setError(''); }}
                        >
                            Try Again
                        </button>
                    </div>
                ) : (
                    /* Email form */
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="reset-email">Email Address</label>
                            <div className="reset-input-wrapper">
                                <span className="input-icon">📧</span>
                                <input
                                    type="email"
                                    id="reset-email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter your registered email"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading}
                        >
                            {loading ? <span className="spinner"></span> : 'Send Reset Link'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        Remember your password?{' '}
                        <Link to="/login" className="auth-link">
                            Back to Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
