from abc import ABC, abstractmethod
from typing import List, Dict

class BaseProductFetcher(ABC):
    #valid categories for the fetcher - category to fetch needs to be one of these
    VALID_CATEGORIES: list[str] = ['suodatinkahvi']

    category: str
    def __init_subclass__(cls, **kwargs):
        """Validates that subclasses set a valid category"""
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, 'category'):
            raise TypeError(f"Can't instantiate abstract class {cls.__name__} without 'category' attribute")
        if cls.category not in cls.VALID_CATEGORIES:
            raise ValueError(f"Invalid category '{cls.category}'. Must be one of: {cls.VALID_CATEGORIES}")

    #abstract class method definitions begin
    @abstractmethod
    def fetch_prices(self) -> List[Dict]:
        """Fetch and return coffee price data as list of dicts."""
        pass
