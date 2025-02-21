import React from 'react';
import Footer from './Footer';
import Header from './Header';
import ScrollToTop from './ScrollToTop';

interface MainLayoutProps {
  children: any;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <Header />
      <main className="container">{children}</main>
      <Footer />
      <ScrollToTop />
    </>
  );
};

export default MainLayout;
