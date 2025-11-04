export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="footer">
      <div className="section-inner">
        <div className="footer-content">
          <span className="eyebrow-footer">CoH Music</span>
          <p>© {year} CoH Music. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
