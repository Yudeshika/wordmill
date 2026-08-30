import coinImg from '../assets/images/coin.png';

export default function FlyingCoins({ coins }) {
  return coins.map((c) => (
    <img
      key={c.id}
      src={coinImg}
      className="flying-coin"
      aria-hidden="true"
      alt=""
      style={{
        left: c.x,
        top: c.y,
        '--dx': `${c.dx}px`,
        '--dy': `${c.dy}px`,
        '--delay': `${c.delay}ms`,
      }}
    />
  ));
}
