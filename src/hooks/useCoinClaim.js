import { useCallback, useEffect, useRef, useState } from 'react';

const BONUS_REWARD = 5;
const FLIGHT = 500;
const STAGGER = 80;

export function useCoinClaim({ progress, setProgress }) {
  const [coinClaim, setCoinClaim]     = useState(false);
  const [flyingCoins, setFlyingCoins] = useState([]);
  const claimBtnRef   = useRef(null);
  const coinHudRef    = useRef(null);
  const transferTimer = useRef(null);
  const claimTimer    = useRef(null);
  const cleanupTimer  = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(transferTimer.current);
      clearTimeout(claimTimer.current);
      clearTimeout(cleanupTimer.current);
    };
  }, []);

  const claimCoins = useCallback(() => {
    if (!progress.unclaimedCoins) return;

    const fromEl = claimBtnRef.current;
    const toEl   = coinHudRef.current;

    if (!fromEl || !toEl) {
      setProgress((p) => ({ ...p, coins: p.coins + p.unclaimedCoins, unclaimedCoins: 0 }));
      return;
    }

    const from    = fromEl.getBoundingClientRect();
    const to      = toEl.getBoundingClientRect();
    const count   = Math.min(Math.ceil(progress.unclaimedCoins / BONUS_REWARD), 5);
    const originX = from.left + from.width  / 2 - 14;
    const originY = from.top  + from.height / 2 - 14;
    const destX   = to.left   + to.width    / 2 - 14;
    const destY   = to.top    + to.height   / 2 - 14;

    setFlyingCoins(
      Array.from({ length: count }, (_, i) => ({
        id:    Date.now() + i,
        x:     originX,
        y:     originY,
        dx:    destX - originX,
        dy:    destY - originY,
        delay: i * STAGGER,
      }))
    );

    transferTimer.current = setTimeout(() => {
      setProgress((p) => ({ ...p, coins: p.coins + p.unclaimedCoins, unclaimedCoins: 0 }));
      setCoinClaim(true);
      claimTimer.current = setTimeout(() => setCoinClaim(false), 600);
    }, FLIGHT);

    cleanupTimer.current = setTimeout(
      () => setFlyingCoins([]),
      FLIGHT + (count - 1) * STAGGER + 100
    );
  }, [progress.unclaimedCoins, setProgress]);

  return { coinClaim, flyingCoins, claimBtnRef, coinHudRef, claimCoins };
}
