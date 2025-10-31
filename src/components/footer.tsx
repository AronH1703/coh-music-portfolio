export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer id="footer" className="footer">
      <div className="section-inner">
        <div className="space-y-2">
          <span className="eyebrow">CoH Music</span>
          <p>© {year} CoH Music. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
