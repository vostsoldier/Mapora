import React from 'react';
import { motion } from 'framer-motion';
import '../Home.css';

function PrivacyPolicyModal({ onClose }) {
  return (
    <motion.div
      className="privacy-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="privacy-modal-content" 
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
      >
        <h2>Privacy Policy for Mapora</h2>
        <div className="privacy-text">
          <p>
            <strong>Introduction</strong><br />
            Mapora ("we", "us", "our") values your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and services (collectively, the "Service"). By using our Service, you agree to the collection and use of your information in accordance with this policy.
          </p>
          <p>
            <strong>Information We Collect</strong><br />
            <em>Personal Information:</em> When you register or subscribe, we may collect personal details such as your full name, date of birth, email address, username, and payment information.<br />
            <em>Usage Data:</em> We gather data on how you interact with the Service, including IP addresses, browser type, device information, and navigation patterns.<br />
            <em>Uploaded Content:</em> Any files, images, PDFs, videos, or other content you upload are stored in our database along with associated metadata.<br />
            <em>Cookies and Tracking Technologies:</em> We use cookies and similar technologies to enhance your experience, personalize content, and analyze traffic.
          </p>
          <p>
            <strong>How We Use Your Information</strong><br />
            Your information is used to provide, maintain, and improve the Service; process payments and manage your account; analyze usage trends and optimize our platform; communicate with you about updates, newsletters, and marketing (with consent where required); ensure the security of our Service; and comply with legal obligations.
          </p>
          <p>
            <strong>Cookies and Tracking Technologies</strong><br />
            We use cookies, web beacons, and other tracking technologies to collect information about your interactions with our Service. You can manage your cookie preferences through your browser settings.
          </p>
          <p>
            <strong>Data Sharing and Disclosure</strong><br />
            We do not sell or rent your personal information. We may share your data with trusted third parties (such as payment processors or hosting services) or if required by law. In business transfers, your data may be transferred as part of the transaction.
          </p>
          <p>
            <strong>Data Security</strong><br />
            We implement industry-standard security measures to protect your information. However, no transmission method is completely secure.
          </p>
          <p>
            <strong>Data Retention</strong><br />
            We retain your personal information for as long as necessary to provide the Service and fulfill the purposes in this policy.
          </p>
          <p>
            <strong>Your Rights and Choices</strong><br />
            Depending on your jurisdiction, you may have rights to access, correct, or delete your personal information, object to its processing, or withdraw consent.
          </p>
          <p>
            <strong>International Data Transfers</strong><br />
            Your information may be stored or processed on servers outside your country. By using the Service, you consent to these transfers in accordance with applicable laws.
          </p>
          <p>
            <strong>Children's Privacy</strong><br />
            Our Service is not intended for children under the age of 13. If we learn that we have inadvertently collected personal data from a child under 13, we will delete it.
          </p>
          <p>
            <strong>Changes to This Privacy Policy</strong><br />
            We may update this Privacy Policy periodically. We will notify registered users at least 30 days in advance via email and/or a notice on our website.
          </p>
          <p>
            <strong>Contact Information</strong><br />
            For any questions or concerns regarding this Privacy Policy, please contact us at: peter.parkwb@gmail.com.
          </p>
        </div>
        <button className="btn" onClick={onClose}>Close</button>
      </motion.div>
    </motion.div>
  );
}

export default PrivacyPolicyModal;