import React from 'react';
import '../styles/components/SocialLinks.css';

export default function SocialLinks({ variant = '' }) {
  return (
    <div className={`social-links-container ${variant}`}>
      <a 
        href="https://youtube.com/@radzeryt" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="social-link youtube-link"
        title="YouTube - RadzerYT"
      >
        <div className="social-avatar">
          <img 
            src="/assets/images/profileyt.jpg" 
            alt="RadzerYT"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="social-icon-fallback">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </div>
        </div>
        <span className="social-username">@RadzerYT</span>
      </a>

      <a 
        href="https://tiktok.com/@radzeryt" 
        target="_blank" 
        rel="noopener noreferrer" 
        className="social-link tiktok-link"
        title="TikTok - RadzerYT"
      >
        <div className="social-avatar">
          <img 
            src="/assets/images/profileyt.jpg" 
            alt="RadzerYT"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
          <div className="social-icon-fallback">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
            </svg>
          </div>
        </div>
        <span className="social-username">@RadzerYT</span>
      </a>
    </div>
  );
}