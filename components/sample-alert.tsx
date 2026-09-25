export default function SampleAlert() {
  return (
    <div className="sample-alert">
      <div className="sample-alert-mail">
        <div className="sample-alert-head">
          <span><i />TripSignal</span>
          <strong>Signal found</strong>
        </div>
        <p className="sample-alert-subject">TripSignal found $612 · MCI → LIS</p>
        <div className="sample-alert-card">
          <p className="sample-alert-kicker"><i />Signal found</p>
          <p className="sample-alert-price"><span>$</span>612</p>
          <p className="sample-alert-route">MCI <span>→</span> LIS</p>
          <p className="sample-alert-dates">Mar 12 – Mar 21, 2027 · 9 days</p>
          <p className="sample-alert-details">TAP Air Portugal · Economy · 1 stop · 14h 20m</p>
          <div className="sample-alert-target">
            <span>Your target</span>
            <span><strong>$700</strong><em>$88 below target</em></span>
          </div>
          <span className="sample-alert-cta">View signal</span>
        </div>
        <p className="sample-alert-note">This is a sample. Real alerts land in your inbox the moment a fare matches your watch.</p>
      </div>
    </div>
  );
}
