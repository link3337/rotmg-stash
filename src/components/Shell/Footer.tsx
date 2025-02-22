import React from 'react';
import styles from './Footer.module.scss';

const icons = [
  { href: 'https://vitejs.dev', iconClass: styles.vite, src: '/vite.svg', alt: 'Vite logo' },
  { href: 'https://tauri.app', iconClass: styles.tauri, src: '/tauri.svg', alt: 'Tauri logo' },
  { href: 'https://reactjs.org', iconClass: styles.react, src: '/react.svg', alt: 'React logo' },
  { href: 'https://redux.js.org', iconClass: styles.redux, src: '/redux.svg', alt: 'Redux logo' },
  {
    href: 'https://primereact.org',
    iconClass: styles.prime,
    src: '/primereact.svg',
    alt: 'PrimeReact logo'
  }
];

const Footer: React.FC = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerCopyright}>
        Made with ❤️ by
        <a
          href="https://github.com/link3337"
          target="_blank"
          rel="noopener noreferrer"
          className={styles.footerLink}
        >
          Link3337
        </a>
        <span style={{ marginLeft: '5px' }}>and</span>
      </div>
      <div className={styles.footerPoweredBy}>
        <div className={styles.footerIcons}>
          {icons.map((icon, index) => (
            <a key={index} href={icon.href} target="_blank" rel="noopener noreferrer">
              <img
                src={icon.src}
                className={`${styles.footerIcon} ${icon.iconClass}`}
                alt={icon.alt}
              />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
