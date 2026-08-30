import React from 'react';
import Image from 'next/image';
import styles from '@/styles/CreditsSection.module.css';

const CreditsSection = () => {
  return (
    <section className={styles.creditsSection}>
      <div className={styles.backgroundBlur}></div>

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.textContainer}>
          <h1 className={styles.bigIdea}>Dealo</h1>
          <p className={styles.description}>
            AI-powered deals & discovery. Built for the modern marketplace.
          </p>
        </div>
        <div className={styles.characterCutout}>
          <Image
            src="/images/profile1.jpg"
            alt="Character"
            width={300}
            height={400}
            className={styles.characterImage}
          />
          <div className={styles.characterOverlay}></div>
        </div>
      </div>

      {/* Contact Info - Top Right */}
      <div className={styles.contactTop}>
        <span>For Projects:</span>
        <span>chigwayataku@gmail.com</span>
        <span>
          Portfolio{' '}
          <a href="https://site.google.com/view/jitelegor/home" target="_blank" rel="noopener noreferrer">
            view
          </a>
        </span>
      </div>

      {/* Branding - Bottom Left */}
      <div className={styles.contactBottom}>
        <div className={styles.brandBlock}>
          <span className={styles.createdBy}>Created by</span>
          <span className={styles.designer}>Nomad Systems</span>
        </div>

        {/* Logo mark — "D" styled like a badge */}
        <span>
            <Image 
              src="/images/logosvg.svg" 
              alt="Logo" 
              width={250} 
              height={150} 
            />
          
        </span>
      </div>
    </section>
  );
};

export default CreditsSection;