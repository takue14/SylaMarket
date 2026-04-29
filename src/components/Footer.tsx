import { FaTwitter, FaInstagram, FaFacebook } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer style={{ padding: '1rem', textAlign: 'center', background: '#fff' }}>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        <div>
          <h4>About</h4>
          <a href="#">Meet The Team</a>
          <a href="#">Contact Us</a>
        </div>
        <div>
          <h4>Support</h4>
          <a href="#">Shipping</a>
          <a href="#">Return</a>
          <a href="#">FAQ</a>
        </div>
      </div>
      <div style={{ margin: '1rem 0' }}>
        <FaTwitter />
        <FaInstagram />
        <FaFacebook />
      </div>
      <p>Copyright © 2023 Stuffus. All Rights Reserved.</p>
      <a href="#">Terms of Service</a> <a href="#">Privacy Policy</a>
    </footer>
  );
}