// src/app/credits/page.tsx (updated: use Next/Image for optimized images)
import React from 'react';
import Image from 'next/image';
import styles from '@/styles/CreditsSection.module.css';

const CreditsSection = () => {
  return (
    <section className={styles.creditsSection}>
      <div className={styles.backgroundBlur}></div>
      {/* Ruler Scale on the Left */}
   

      {/* Main Content */}
      <div className={styles.mainContent}>
        <div className={styles.textContainer}>
          <h1 className={styles.bigIdea}>Big Idea</h1>
          <p className={styles.description}>
            sparks imagination, shaping brand identity with every innovation.
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
        <span>For Frojects:</span>
        <span>chigwayataku@gmail.com</span>
        <span>
          portfolio{' '}
          <a href="https://site.google.com/view/jitelegor/home" target="_blank" rel="noopener noreferrer">
            view
          </a>
        </span>
      </div>

      {/* Contact Info - Bottom Left */}
      <div className={styles.contactBottom}>
        <span>Designed By</span>
        <span className={styles.designer}>Nomad</span>
        <span className={styles.icons}>
          <span className={styles.icon}>
            <Image 
              src="/images/logosvg.svg" 
              alt="Logo" 
              width={100} 
              height={100} 
            />
          </span>
          
        </span>
      </div>
    </section>
  );
};

export default CreditsSection;