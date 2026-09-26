import { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showSuccessToast, showErrorToast } from '../../utils/swalUtils';
import { API_BASE_URL } from '../../config/apiConfig';
import './ForgotPassword.css';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [tokenValid, setTokenValid] = useState(null); // null = checking, true/false

    // Validate token on page load
    useEffect(() => {
        if (!token) {
            setTokenValid(false);
            return;
        }

        const validateToken = async () => {
            try {
                await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/auth/password-reset/validate_token/`, {
                    token: token,
                });
                setTokenValid(true);
            } catch {
                setTokenValid(false);
            }
        };

        validateToken();
    }, [token]);

    // Password strength checker
    const getPasswordStrength = (pwd) => {
        if (!pwd) return { level: 0, label: '', color: '' };

        let score = 0;
        if (pwd.length >= 8) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        const levels = [
            { level: 1, label: 'Weak', color: '#f44336' },
            { level: 2, label: 'Fair', color: '#ff9800' },
            { level: 3, label: 'Good', color: '#2196f3' },
            { level: 4, label: 'Strong', color: '#4caf50' },
        ];

        return levels[score - 1] || { level: 0, label: '', color: '' };
    };

    const strength = getPasswordStrength(password);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password || !confirmPassword) {
            setError('Please fill in both fields');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);

        try {
            await axios.post(`${API_BASE_URL.replace(/\/$/, '')}/auth/password-reset/confirm/`, {
                token: token,
                password: password,
            });

            setSuccess(true);
            showSuccessToast(
                'Password Reset!',
                'Your password has been changed successfully.'
            );

            // Redirect to login after 3 seconds
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            const data = err.response?.data;
            const message =
                data?.password?.[0] ||
                data?.detail ||
                data?.token?.[0] ||
                'Reset failed. The link may have expired.';
            setError(message);
            showErrorToast('Error', message);
        } finally {
            setLoading(false);
        }
    };

    // Token is invalid or missing
    if (tokenValid === false) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo-mark">
                        <div className="logo-icon">🩸</div>
                        <span className="logo-text">HOPEDROP</span>
                    </div>
                    <div className="auth-header">
                        <h2>Invalid Reset Link</h2>
                        <p>This password reset link is invalid or has expired.</p>
                    </div>
                    <div className="reset-invalid-box">
                        <div className="invalid-icon">⚠️</div>
                        <p>Please request a new password reset link.</p>
                        <Link to="/forgot-password" className="auth-submit-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            Request New Link
                        </Link>
                    </div>
                    <div className="auth-footer">
                        <p>
                            <Link to="/login" className="auth-link">Back to Login</Link>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Still validating token
    if (tokenValid === null) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <div className="auth-logo-mark">
                        <div className="logo-icon">🩸</div>
                        <span className="logo-text">HOPEDROP</span>
                    </div>
                    <div className="auth-header">
                        <h2>Verifying Link...</h2>
                        <p>Please wait while we verify your reset link.</p>
                    </div>
                    <div className="reset-loading-box">
                        <span className="spinner"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-container">
            <div className="auth-card">

                <div className="auth-logo-mark">
                    <div className="logo-icon">🩸</div>
                    <span className="logo-text">HOPEDROP</span>
                </div>

                <div className="auth-header">
                    <h2>{success ? 'Password Changed!' : 'Reset Password'}</h2>
                    <p>
                        {success
                            ? 'Redirecting you to login...'
                            : 'Enter your new password below'}
                    </p>
                </div>

                {error && <div className="auth-error-message">⚠️ {error}</div>}

                {success ? (
                    <div className="reset-success-box">
                        <div className="success-icon-wrapper">
                            <svg className="success-checkmark" viewBox="0 0 52 52">
                                <circle className="checkmark-circle" cx="26" cy="26" r="25" fill="none" />
                                <path className="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <p className="reset-hint">You can now login with your new password.</p>
                        <Link to="/login" className="auth-submit-btn" style={{ textDecoration: 'none', textAlign: 'center' }}>
                            Go to Login
                        </Link>
                    </div>
                ) : (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label htmlFor="new-password">New Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="new-password"
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Enter new password"
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex="-1"
                                >
                                    {showPassword ? 'Hide' : 'Show'}
                                </button>
                            </div>

                            {/* Password strength indicator */}
                            {password && (
                                <div className="password-strength">
                                    <div className="strength-bar-track">
                                        <div
                                            className="strength-bar-fill"
                                            style={{
                                                width: `${(strength.level / 4) * 100}%`,
                                                backgroundColor: strength.color,
                                            }}
                                        />
                                    </div>
                                    <span className="strength-label" style={{ color: strength.color }}>
                                        {strength.label}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirm-password">Confirm Password</label>
                            <div className="password-input-wrapper">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    id="confirm-password"
                                    autoComplete="new-password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={loading}
                                    placeholder="Confirm new password"
                                />
                            </div>
                            {confirmPassword && password !== confirmPassword && (
                                <span className="password-mismatch">Passwords do not match</span>
                            )}
                            {confirmPassword && password === confirmPassword && confirmPassword.length > 0 && (
                                <span className="password-match">✓ Passwords match</span>
                            )}
                        </div>

                        <button
                            type="submit"
                            className={`auth-submit-btn ${loading ? 'loading' : ''}`}
                            disabled={loading || password !== confirmPassword}
                        >
                            {loading ? <span className="spinner"></span> : 'Reset Password'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p>
                        <Link to="/login" className="auth-link">Back to Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
