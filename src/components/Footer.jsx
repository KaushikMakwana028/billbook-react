import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div>
        © {currentYear} <b>BillBook</b>. All rights reserved. Powered by Vision Technolabs.
      </div>
      
    </footer>
  );
};

export default Footer;
