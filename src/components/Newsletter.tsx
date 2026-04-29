export default function Newsletter() {
  return (
    <section style={{ background: '#333', color: '#fff', padding: '2rem', textAlign: 'center' }}>
      <h2>Ready to Get Our New Stuff?</h2>
      <input type="email" placeholder="Your Email" style={{ padding: '0.5rem', width: '300px' }} />
      <button style={{ background: '#fff', color: '#333', padding: '0.5rem 1rem' }}>Send</button>
      <p>Stuffus for Homes and Needs...</p>
    </section>
  );
}