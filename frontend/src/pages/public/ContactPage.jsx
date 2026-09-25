import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Mail, Phone, MapPin, Clock, Send, Heart,
    CheckCircle, User, MessageSquare, ChevronRight
} from 'lucide-react';
import { CONTACT } from '../../config/imageAssets';
import './ContactPage.css';


const ContactPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Scroll animations
    useEffect(() => {
        const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate email send
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
        }, 1500);
    };

    const contactCards = [
        {
            icon: <Mail size={36} color="white" />,
            label: 'Email Us',
            title: 'General Enquiries',
            detail: 'info@hopedrop.lk',
            sub: 'support@hopedrop.lk',
            href: 'mailto:info@hopedrop.lk',
            cta: 'Send an Email',
            image: CONTACT.generalEnquiries,
        },
        {
            icon: <Phone size={36} color="white" />,
            label: 'Call Us',
            title: 'Hotline & Emergency',
            detail: '011 236 9931',
            sub: 'Emergency: 1990',
            href: 'tel:0112369931',
            cta: 'Call Now',
            image: CONTACT.hotlineEmergency,
        },
        {
            icon: <MapPin size={36} color="white" />,
            label: 'Visit Us',
            title: 'Main Branch',
            detail: 'National Blood Center',
            sub: '555/5, Elvitigala Mawatha, Narahenpita, Colombo 00500, Sri Lanka',
            href: 'https://maps.google.com/?q=National+Blood+Center+Colombo',
            cta: 'Get Directions',
            image: CONTACT.mainBranch,
        },
    ];

    return (
        <div className="contact-page">

            {/* Hero Banner */}
            <section 
                className="contact-hero"
                style={{
                    backgroundImage: `linear-gradient(135deg, rgba(18, 25, 33, 0.92), rgba(183, 28, 28, 0.80)), url(${CONTACT.contactHero})`
                }}
                >
                <div className="contact-hero-overlay" />
                <div className="contact-hero-content">
                    <div className="contact-hero-badge">
                        <Heart size={16} /> Get In Touch
                    </div>
                    <h1>Contact Us</h1>
                    <p>We're here for every question, emergency, or kind word. Reach out to HOPEDROP — anytime, anywhere.</p>
                    <div className="contact-hero-breadcrumb">
                        <Link to="/">Home</Link>
                        <ChevronRight size={14} />
                        <span>Contact</span>
                    </div>
                </div>
            </section>

            {/* Contact Info Cards */}
            <section className="contact-cards-section">
                <div className="container">
                    <div className="contact-cards-grid">
                        {contactCards.map((card, i) => (
                            <div
                                key={i}
                                className="contact-service-box animate-on-scroll"
                                style={{ transitionDelay: `${i * 0.15}s` }}
                            >
                                {/* Reusing the exact landing page card structure */}
                                <div className="service-card-wrapper contact-card-inner">
                                    <div className="service-img-box">
                                        <img src={card.image} alt={card.label} />
                                    </div>
                                    <div className="service-content-main-box">
                                        <div className="service-icon-box bg-dark">
                                            {card.icon}
                                        </div>
                                        <p className="contact-card-label">{card.label}</p>
                                        <h3 className="service-box-title">{card.title}</h3>
                                        <p className="contact-card-detail">{card.detail}</p>
                                        <p className="contact-card-sub">{card.sub}</p>
                                    </div>
                                    <div className="service-read-more">
                                        <a href={card.href} target="_blank" rel="noopener noreferrer">
                                            {card.cta}
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Hours + Map Strip */}
            <section className="contact-hours-strip animate-on-scroll">
                <div className="container hours-strip-inner">
                    <div className="hours-item">
                        <Clock size={20} color="var(--color-primary)" />
                        <div>
                            <strong>Mon – Fri</strong>
                            <span>8:00 AM – 5:00 PM</span>
                        </div>
                    </div>
                    <div className="hours-divider" />
                    <div className="hours-item">
                        <Clock size={20} color="var(--color-primary)" />
                        <div>
                            <strong>Saturday</strong>
                            <span>8:00 AM – 12:00 PM</span>
                        </div>
                    </div>
                    <div className="hours-divider" />
                    <div className="hours-item">
                        <Phone size={20} color="var(--color-primary)" />
                        <div>
                            <strong>Emergency Hotline</strong>
                            <span>24 / 7 — Dial 1990</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Form + Map side by side */}
            <section className="contact-main-section">
                <div className="container contact-main-grid">

                    {/* Email Form */}
                    <div className="contact-form-wrapper animate-on-scroll">
                        <div className="contact-form-header">
                            <h2>Send Us a Message</h2>
                            <p>Fill in the form below and our team will respond within 24 hours.</p>
                        </div>

                        {submitted ? (
                            <div className="form-success">
                                <CheckCircle size={48} color="var(--color-primary)" />
                                <h3>Message Sent!</h3>
                                <p>Thank you for reaching out. We'll get back to you within 24 hours.</p>
                                <button className="btn-contact-submit" onClick={() => setSubmitted(false)}>
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form className="contact-form" onSubmit={handleSubmit} noValidate>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">
                                            <User size={14} /> Full Name
                                        </label>
                                        <input
                                            id="name"
                                            name="name"
                                            type="text"
                                            placeholder="e.g. Kamal Perera"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="email">
                                            <Mail size={14} /> Email Address
                                        </label>
                                        <input
                                            id="email"
                                            name="email"
                                            type="email"
                                            placeholder="e.g. kamal@email.com"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="subject">
                                        <MessageSquare size={14} /> Subject
                                    </label>
                                    <input
                                        id="subject"
                                        name="subject"
                                        type="text"
                                        placeholder="e.g. Blood Donation Inquiry"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">
                                        <MessageSquare size={14} /> Message
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={5}
                                        placeholder="Write your message here..."
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className={`btn-contact-submit ${loading ? 'loading' : ''}`}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <span className="spinner" />
                                    ) : (
                                        <><Send size={16} /> Send Message</>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Map */}
                    <div className="contact-map-wrapper animate-on-scroll" style={{ transitionDelay: '0.2s' }}>
                        <div className="contact-map-header">
                            <h2><MapPin size={24} /> Find Our Main Branch</h2>
                            <p>National Blood Center — 555/5 Elvitigala Mawatha, Narahenpita, Colombo 00500</p>
                        </div>
                        <div className="contact-map-frame">
                            <iframe
                                title="National Blood Center Location"
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3960.671046714073!2d79.85871807469796!3d6.929871593069695!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae2591146399bd5%3A0xc02cf3c9f53eec0!2sNational%20Blood%20Center!5e0!3m2!1sen!2slk!4v1711200000000!5m2!1sen!2slk"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                            />
                        </div>
                        {/* Address Detail Card */}
                        <div className="address-detail-card">
                            <div className="address-detail-row">
                                <MapPin size={18} color="var(--color-primary)" />
                                <div>
                                    <strong>National Blood Center</strong>
                                    <span>555/5, Elvitigala Mawatha,<br />Narahenpita, Colombo 00500,<br />Sri Lanka</span>
                                </div>
                            </div>
                            <div className="address-detail-row">
                                <Phone size={18} color="var(--color-primary)" />
                                <div>
                                    <strong>Main Telephone</strong>
                                    <span>+94 11 236 9931</span>
                                </div>
                            </div>
                            <div className="address-detail-row">
                                <Mail size={18} color="var(--color-primary)" />
                                <div>
                                    <strong>Official Email</strong>
                                    <span>info@hopedrop.lk</span>
                                </div>
                            </div>
                            <a
                                href="https://maps.google.com/?q=National+Blood+Center+Colombo"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="directions-btn"
                            >
                                <MapPin size={14} /> Get Directions
                            </a>
                        </div>
                    </div>

                </div>
            </section>

            {/* Footer */}
            <footer className="footer-new">
                <div className="container footer-grid">
                    <div className="footer-brand">
                        <h2><Heart color="var(--color-primary)" fill="var(--color-primary)" /> HOPEDROP</h2>
                        <p>National Blood Bank Management System of Sri Lanka.</p>
                    </div>
                    <div className="footer-links">
                        <h4>Quick Links</h4>
                        <Link to="/donor">Donor Portal</Link>
                        <Link to="/events">Blood Camps</Link>
                        <Link to="/login">Hospital Login</Link>
                        <Link to="/contact">Contact Us</Link>
                    </div>
                    <div className="footer-contact">
                        <h4>Emergency Contact</h4>
                        <p>Hotline: 011 236 9931</p>
                        <p>Email: info@hopedrop.lk</p>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} HOPEDROP National Blood Transfusion Service. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default ContactPage;
