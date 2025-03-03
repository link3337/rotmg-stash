import React from 'react';
import Footer from './Footer';
import Header from './Header';
import styles from './MainLayout.module.scss';
import RateLimitBanner from './RateLimitBanner';
import ScrollToTop from './ScrollToTop';

interface MainLayoutProps {
  children: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <RateLimitBanner />
      <main className={styles.contentWrapper}>{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default MainLayout;
