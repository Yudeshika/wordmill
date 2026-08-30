import coinImg from '../assets/images/coin.png';

export default function WinOverlay({ visible }) {
  if (!visible) return null;
  return (
    <div className="win-overlay" aria-hidden="true">
      <img src={coinImg} className="win-coin" alt="" />
    </div>
  );
}
