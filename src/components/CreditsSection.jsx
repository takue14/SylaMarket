import React from 'react';
import '@/styles/CreditsSection.css';

const CreditsSection = () => {
  return (
    <section className="credits-section">
      {/* Ruler Scale on the Left */}
      <div className="ruler-scale">
        {[...Array(11).keys()].map((inch) => (
          <div key={inch} className="ruler-mark">
            <span>{inch}</span>
          </div>
        ))}
        <span className="inches-label">inches</span>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="text-container">
          <h1 className="big-idea">Big Idea</h1>
          <p className="description">
            sparks imagination, shaping brand identity with every innovation.
          </p>
        </div>
        <div className="character-cutout">
          <img src="/placeholder-character.jpg" alt="Character" />
        </div>
      </div>

      {/* Contact Info - Top Right */}
      <div className="contact-top">
        <span>for projects:</span>
        <span>jiletegor@gmail.com</span>
        <span>
          portfolio{' '}
          <a href="https://site.google.com/view/jitelegor/home" target="_blank" rel="noopener noreferrer">
            view
          </a>
        </span>
      </div>

      {/* Contact Info - Bottom Left */}
      <div className="contact-bottom">
        <span>designed by</span>
        <span className="designer">fegor jite</span>
        <span className="icons">
          <span>⓿</span>
          <span>⓿</span>
        </span>
      </div>
    </section>
  );
};

export default CreditsSection;