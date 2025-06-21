from abc import ABC, abstractmethod
from typing import List, Dict
import psycopg2
import os

class BaseProductFetcher(ABC):
    """Defines basic operations for any fetcher per webshop"""
    #valid categories for the fetcher - category to fetch needs to be one of these
    VALID_CATEGORIES: list[str] = ['suodatinkahvi']

    category: str
    _data_source: str
    
    def __init_subclass__(cls, **kwargs):
        """Validates that subclasses set a valid category"""
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, 'category'):
            raise TypeError(f"Can't instantiate abstract class {cls.__name__} without 'category' attribute")
        if cls.category not in cls.VALID_CATEGORIES:
            raise ValueError(f"Invalid category '{cls.category}'. Must be one of: {cls.VALID_CATEGORIES}")
        
    def __init__(self):
        """Connecting to the db of this solution - it is used by all subclasses"""
        self._conn = psycopg2.connect(
            host=os.environ['DB_HOST'],
            database=os.environ['DB_NAME'],
            user=os.environ['DB_USER'],
            password=os.environ['DB_PASSWORD']
        )

    def close_connection(self):
        """Close connection to db if it exists"""
        if self._conn:
            self._conn.close()

    #abstract class method definitions begin
    @abstractmethod
    def target_tbl_has_existing_data(self):
        """
        Checks if there are existing rows in the products_and_prices table 
        for the selected data source.
        
        Returns:
            bool: True if there are existing K-ruoka rows (>0), False if no rows (0)
        """
        pass

    @abstractmethod
    def init_fetch_and_insert(self):
        """Performs both fetch + insert operations, returns some description string of the operation end result from insert"""
        pass

    @abstractmethod
    def run_update(self):
        """Performs a scheduled fetch and update of prices."""
        pass
