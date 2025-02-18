import React from 'react';
import { motion } from 'framer-motion';
import '../Home.css';

function TermsModal({ onClose }) {
  return (
    <motion.div
      className="terms-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="terms-modal-content" 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <h2>Terms of Service</h2>
        <div className="terms-text">
          <p>
            <strong>Introduction</strong><br />
            Welcome to Mapora, a SaaS platform provided by Mapora ("we", "us", "our"), based in New York City, NY, USA. By accessing or using our website and services (collectively, the "Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree with these Terms, please do not use the Service.
          </p>
          <p>
            <strong>Description of the Service</strong><br />
            Mapora is a software-as-a-service platform designed to help users organize thoughts and projects. The Service utilizes a system of interconnected nodes (representing parts of ideas or tasks) linked via edges/connections. Data, including user account information and content uploaded by users, is stored on our database.
          </p>
          <p>
            <strong>Eligibility and Account Registration</strong><br />
            You must be at least 13 years old to use Mapora. To access certain features, you must register for an account and provide your full name, date of birth, email address, a username, and a password. If we discover that an account belongs to an underaged individual or is being used in violation of these Terms, we reserve the right to delete the account immediately and without appeal.
          </p>
          <p>
            <strong>User Content and Data</strong><br />
            You retain ownership of any content you upload. However, by uploading, you grant Mapora a worldwide, non-exclusive, royalty-free license to store and display your content solely for providing the Service.
          </p>
          <p>
            <strong>Payment and Billing</strong><br />
            Your subscription is billed on a recurring monthly basis. You may cancel at any time, but note that there are no refunds for already-paid fees.
          </p>
          <p>
            <strong>Prohibited Conduct</strong><br />
            You agree not to engage in harassment, spam, or illegal activities. Any violations may result in immediate account termination without appeal.
          </p>
          <p>
            <strong>Disclaimers and Limitations of Liability</strong><br />
            Mapora provides its service “as is” without warranties, and is not liable for any indirect or incidental damages arising from your use of the Service.
          </p>
          <p>
            <strong>International Data Transfers</strong><br />
            Your information may be transferred and maintained on servers outside your country.
          </p>
          <p>
            <strong>Dispute Resolution</strong><br />
            All disputes shall be governed by the laws of the State of New York and resolved exclusively in New York courts.
          </p>
          <p>
            <strong>Changes to the Terms</strong><br />
            We reserve the right to modify these Terms at any time. Continued use of the Service after modifications constitutes your acceptance of the updated Terms.
          </p>
          <p>
            <strong>Entire Agreement</strong><br />
            These Terms, combined with our Privacy Policy, constitute the entire agreement regarding your use of Mapora.
          </p>
          <p>
            <strong>Severability</strong><br />
            If any provision is found unenforceable, the remaining provisions will continue in full force.
          </p>
          <p>
            <strong>Contact Information</strong><br />
            If you have any questions or concerns regarding these Terms, please contact us at: peter.parkwb@gmail.com.
          </p>
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </motion.div>
    </motion.div>
  );
}

export default TermsModal;