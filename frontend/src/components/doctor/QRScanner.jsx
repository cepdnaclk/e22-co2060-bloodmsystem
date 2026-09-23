import React, { useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { scanDonorQR } from '../../api/donorService';
import { Camera, XCircle, CheckCircle } from 'lucide-react';
import Swal from 'sweetalert2';

const QRScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);

    const startScanner = () => {
        setScannerActive(true);
        setScanResult(null);
        setTimeout(() => {
            const html5QrcodeScanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                /* verbose= */ false
            );
            html5QrcodeScanner.render(onScanSuccess, onScanFailure);

            function onScanSuccess(decodedText, decodedResult) {
                html5QrcodeScanner.clear();
                setScannerActive(false);
                handleQrCodeScanned(decodedText);
            }

            function onScanFailure(error) {
                // handle scan failure, usually better to ignore and keep scanning
            }
        }, 100);
    };

    const handleQrCodeScanned = async (qrId) => {
        setLoading(true);
        const res = await scanDonorQR(qrId);
        setLoading(false);
        if (res.success) {
            setScanResult(res.data);
        } else {
            Swal.fire({
                title: 'Invalid QR Code',
                text: 'Could not fetch donor details from this QR code.',
                icon: 'error'
            });
        }
    };

    return (
        <div className="card fade-in qr-scanner-card" style={{ padding: '20px' }}>
            <div className="card-header" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <h2 style={{ margin: 0 }}>Donor QR Scanner</h2>
                {!scannerActive && (
                    <button className="dashboard btn btn-primary" onClick={startScanner} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Camera size={18} /> Start Scanner
                    </button>
                )}
            </div>

            <div className="card-body">
                {scannerActive && (
                    <div id="reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto', borderRadius: '8px', overflow: 'hidden' }}></div>
                )}

                {loading && <p style={{ textAlign: 'center' }}>Fetching donor details...</p>}

                {scanResult && !scannerActive && !loading && (
                    <div className="donor-result fade-in" style={{
                        padding: '20px',
                        borderRadius: '8px',
                        border: '2px solid',
                        borderColor: scanResult.is_eligible ? '#2e7d32' : '#d32f2f',
                        backgroundColor: scanResult.is_eligible ? '#e8f5e9' : '#ffebee',
                        textAlign: 'center'
                    }}>
                        {scanResult.is_eligible ? (
                            <CheckCircle size={48} color="#2e7d32" style={{ margin: '0 auto 10px' }} />
                        ) : (
                            <XCircle size={48} color="#d32f2f" style={{ margin: '0 auto 10px' }} />
                        )}
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{scanResult.donor_name}</h3>
                        <p style={{ margin: '5px 0', fontSize: '18px' }}>Blood Group: <strong>{scanResult.blood_group}</strong></p>

                        <div style={{ marginTop: '15px' }}>
                            {scanResult.is_eligible ? (
                                <h4 style={{ color: '#2e7d32', margin: 0 }}>✅ Eligible for Donation</h4>
                            ) : (
                                <div>
                                    <h4 style={{ color: '#d32f2f', margin: '0 0 5px 0' }}>❌ Not Eligible</h4>
                                    <p style={{ fontSize: '14px', margin: 0, color: '#666' }}>Last Donated: {scanResult.last_donation_date || 'Unknown'}</p>
                                </div>
                            )}
                        </div>

                        {scanResult.is_eligible && (
                            <button className="btn btn-primary" style={{ marginTop: '20px', width: '100%' }}>
                                Proceed with Donation
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRScanner;
