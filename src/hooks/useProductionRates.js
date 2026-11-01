import { useCallback, useRef, useState } from "react";

const resourceKeys = ["food", "wood", "gold"];

function createSnapshot(game) {
  return {
    game,
    timestamp: performance.now(),
  };
}

export default function useProductionRates(initialGame) {
  const [rates, setRates] = useState({
    food: null,
    wood: null,
    gold: null,
  });
  const previousRef = useRef(createSnapshot(initialGame));

  const resetBaseline = useCallback((game) => {
    previousRef.current = createSnapshot(game);
  }, []);

  const recordCollection = useCallback((game) => {
    const current = createSnapshot(game);
    const previous = previousRef.current;
    const elapsed = (current.timestamp - previous.timestamp) / 1000;

    if (elapsed >= 1) {
      const observedRates = {};

      for (const key of resourceKeys) {
        const change = Number(game[key]) - Number(previous.game[key]);
        observedRates[key] =
          Number.isFinite(change) && change >= 0 ? change / elapsed : null;
      }

      setRates((existingRates) => ({
        food: observedRates.food ?? existingRates.food,
        wood: observedRates.wood ?? existingRates.wood,
        gold: observedRates.gold ?? existingRates.gold,
      }));
    }

    previousRef.current = current;
  }, []);

  return { rates, recordCollection, resetBaseline };
}
