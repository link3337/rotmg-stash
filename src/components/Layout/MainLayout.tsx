import React from 'react';
import GameAssetsBanner from '../GameAssets/GameAssetsBanner';
import RateLimitContainer from '../RateLimit/RateLimitContainer';
import Footer from './Footer';
import Header from './Header';
import styles from './MainLayout.module.scss';
import ScrollToTop from './ScrollToTop';

interface MainLayoutProps {
  children: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={styles.pageContainer}>
      <Header />
      <GameAssetsBanner />
      <RateLimitContainer />
      <main className={styles.contentWrapper}>{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default MainLayout;
