import React from "react";
import { Link } from "react-router-dom";

export default function FooterSitemap() {
  return (
    <footer className="mt-10 text-center text-white/70 text-sm">
      <Link to="/sitemap" className="underline hover:text-white transition-colors">
        View Sitemap
      </Link>
    </footer>
  );
}
