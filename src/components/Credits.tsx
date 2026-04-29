export default function Credits() {
  return (
    <footer style={{ background: '#333', color: 'white', padding: '2rem', textAlign: 'center' }}>
      <h3>Credits</h3>
      <p>Built with ❤️ by xAI Team | Design inspired by modern e-com | Images from Unsplash</p>
      <div style={{ margin: '1rem 0', opacity: 0.8 }}>
        <a href="#" style={{ color: 'white', margin: '0 1rem' }}>Team Member 1</a>
        <a href="#" style={{ color: 'white', margin: '0 1rem' }}>Team Member 2</a>
        <a href="#" style={{ color: 'white', margin: '0 1rem' }}>Contributor</a>
      </div>
      <p style={{ fontSize: '0.9rem', animation: 'fadeIn 2s ease' }}>© 2025 Stuffus. All rights reserved.</p>
    </footer>
  );
}