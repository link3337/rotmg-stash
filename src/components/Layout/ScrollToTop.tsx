import { Button } from 'primereact/button'; // Assuming you are using PrimeReact for the button
import React from 'react';

const ScrollToTop: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Button
      icon="pi pi-arrow-up"
      className="p-button-rounded p-button-primary fab"
      onClick={scrollToTop}
    />
  );
};

export default ScrollToTop;
