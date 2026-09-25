import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/auth/useAuth';
import { getDonorProfile } from '../../services/donorService';
import { CheckCircle2, User, Heart, Calendar, ArrowRight, ShieldCheck, Droplet } from 'lucide-react';

const DonorRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getDonorProfile();
        setProfile(data);
      } catch (err) {
        console.error("Could not fetch donor profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', padding: '0 20px' }}>
      <div className="card" style={{ padding: '32px', textAlign: 'center', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
        <div style={{ 
          width: '72px', 
          height: '72px', 
          borderRadius: '50%', 
          backgroundColor: '#dcfce7', 
          color: '#15803d', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 20px' 
        }}>
          <CheckCircle2 size={40} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>
          Donor Account Active & Registered
        </h1>
        <p className="text-muted" style={{ maxWidth: '560px', margin: '0 auto 24px', fontSize: '1rem', lineHeight: 1.5 }}>
          Your donor profile is automatically registered during sign up. All your blood group, contact, and eligibility details are synced with the National Blood Management System.
        </p>

        {loading ? (
          <p className="text-muted">Loading profile details...</p>
        ) : (
          <div style={{ 
            backgroundColor: '#f8fafc', 
            borderRadius: '16px', 
            padding: '24px', 
            maxWidth: '600px', 
            margin: '0 auto 28px',
            border: '1px solid #e2e8f0',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={18} color="var(--color-primary, #dc2626)" /> Registered Information
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</span>
                <p style={{ fontWeight: 600, margin: '2px 0 0' }}>{profile?.fullName || user?.username || 'Registered Donor'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blood Group</span>
                <p style={{ fontWeight: 700, color: '#dc2626', margin: '2px 0 0' }}>{profile?.blood_group || 'Not specified'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NIC Number</span>
                <p style={{ fontWeight: 600, margin: '2px 0 0' }}>{profile?.nic || 'Verified'}</p>
              </div>
              <div>
                <span className="text-muted" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>District / Location</span>
                <p style={{ fontWeight: 600, margin: '2px 0 0' }}>{profile?.district || 'Sri Lanka'}</p>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <button 
            className="dashboard btn btn-primary" 
            onClick={() => navigate('/donor')}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
          >
            Go to Donor Dashboard <ArrowRight size={18} />
          </button>
          <Link 
            to="/events" 
            className="dashboard btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1rem' }}
          >
            <Calendar size={18} /> Find Donation Camps
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DonorRegistration;
