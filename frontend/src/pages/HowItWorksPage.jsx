import { Link } from 'react-router-dom';

export default function HowItWorksPage() {
  return (
    <div className="page-wrap">
      <div className="section-heading">
        <span className="eyebrow accent">How it works</span>
        <h2>Play. Score. Give back.</h2>
      </div>
      <div className="steps-grid">
        <div className="step-card"><span className="step-index">01</span><h3>Subscribe</h3><p>Pick a monthly or yearly plan and join the member community.</p></div>
        <div className="step-card"><span className="step-index">02</span><h3>Track scores</h3><p>Enter your Stableford score with a valid date and keep your latest five rounds.</p></div>
        <div className="step-card"><span className="step-index">03</span><h3>Select charity</h3><p>Choose the cause you want to support and set your contribution percentage.</p></div>
        <div className="step-card"><span className="step-index">04</span><h3>Join the draw</h3><p>Your subscription keeps you in the monthly draw pool for the next publish cycle.</p></div>
        <div className="step-card"><span className="step-index">05</span><h3>Win</h3><p>Match the prize tiers and see if your numbers come through.</p></div>
        <div className="step-card"><span className="step-index">06</span><h3>Give back</h3><p>Verified winners receive payouts while the platform channels community impact from every entry.</p></div>
      </div>
      <div className="final-cta">
        <Link className="button primary" to="/signup">Join Digital Heroes</Link>
      </div>
    </div>
  );
}
