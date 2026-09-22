import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const charitySamples = [
  { id: 'charity-1', name: 'Youth Sports Foundation', category: 'Youth wellbeing', impact: '£12k funded' },
  { id: 'charity-2', name: 'Local Care Network', category: 'Health & support', impact: '£8k funded' },
  { id: 'charity-3', name: 'Ocean Recovery Trust', category: 'Marine conservation', impact: '£6k funded' },
];

export default function HomePage() {
  return (
    <div className="page-wrap home-page">
      <section className="hero-section">
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <span className="eyebrow">PLAY. WIN. GIVE BACK.</span>
          <h1>Turn every round into real community impact.</h1>
          <p>
            Digital Heroes pairs your golf performance with a monthly prize draw, a charity contribution, and a simple way to make your score matter beyond the course.
          </p>
          <div className="cta-row">
            <Link className="button primary" to="/signup">Start your subscription</Link>
            <Link className="button secondary" to="/how-it-works">See how it works</Link>
          </div>
          <div className="stat-row">
            <div><strong>£48k</strong><span>Charity raised</span></div>
            <div><strong>1,240</strong><span>Active members</span></div>
            <div><strong>12</strong><span>Featured causes</span></div>
          </div>
        </motion.div>
        <motion.div className="hero-card" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <div className="card-panel">
            <div className="mini-label">This month’s draw</div>
            <div className="winning-box">
              <span>5-number jackpot</span>
              <strong>£12,500</strong>
            </div>
            <ul>
              <li>5 number match: 40%</li>
              <li>4 number match: 35%</li>
              <li>3 number match: 25%</li>
            </ul>
          </div>
        </motion.div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow accent">How it works</span>
          <h2>From your scorecard to a positive impact.</h2>
        </div>
        <div className="steps-grid">
          {['Subscribe', 'Enter scores', 'Choose a charity', 'Join the monthly draw', 'Win', 'Give back'].map((step, index) => (
            <div key={step} className="step-card">
              <span className="step-index">0{index + 1}</span>
              <h3>{step}</h3>
            </div>
          ))}
        </div>
      </section>

      <section className="content-section alt-section">
        <div className="section-heading">
          <span className="eyebrow accent">Impact</span>
          <h2>Every participation creates community momentum.</h2>
        </div>
        <div className="impact-grid">
          <div className="impact-card large">
            <strong>10%</strong>
            <p>Minimum contribution from your subscription fee goes directly to your selected cause.</p>
          </div>
          <div className="impact-card">
            <strong>monthly</strong>
            <p>Fresh prize draw each month with transparent, verified payouts.</p>
          </div>
          <div className="impact-card">
            <strong>trusted</strong>
            <p>Proof-based winner review ensures fairness and clarity.</p>
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow accent">How the draw works</span>
          <h2>Three match levels, one monthly spotlight.</h2>
        </div>
        <div className="draw-rules">
          <div className="rule-box"><span>5-number match</span><strong>40% prize share</strong></div>
          <div className="rule-box"><span>4-number match</span><strong>35% prize share</strong></div>
          <div className="rule-box"><span>3-number match</span><strong>25% prize share</strong></div>
        </div>
      </section>

      <section className="content-section">
        <div className="section-heading">
          <span className="eyebrow accent">Featured charities</span>
          <h2>Support causes that matter to your community.</h2>
        </div>
        <div className="charity-grid">
          {charitySamples.map((charity) => (
            <div key={charity.id} className="charity-card">
              <div className="charity-image" style={{ backgroundImage: `url(${charity.image || 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=900&q=80'})` }} />
              <div className="charity-body">
                <span>{charity.category}</span>
                <h3>{charity.name}</h3>
                <p>{charity.impact}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <h2>Ready to play for impact?</h2>
        <Link className="button primary" to="/signup">Join Digital Heroes</Link>
      </section>
    </div>
  );
}
