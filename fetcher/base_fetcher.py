from abc import ABC, abstractmethod
from typing import List, Dict

class BaseCoffeeFetcher(ABC):
    @abstractmethod
    def fetch_prices(self) -> List[Dict]:
        """Fetch and return coffee price data as list of dicts."""
        pass
