import React, { useState, useMemo } from 'react';

// Mock data based on your backend response structure.
// In a real application, you would fetch this from your API.
const mockCoffeeData = [
  { name_finnish: 'Juhla Mokka', normal_price: 5.95, net_weight: 500, data_source: 'K-Ruoka' },
  { name_finnish: 'Presidentti', normal_price: 6.45, net_weight: 500, data_source: 'S-Kaupat' },
  { name_finnish: 'Kulta Katriina', normal_price: 4.99, net_weight: 450, data_source: 'K-Ruoka' },
  { name_finnish: 'Löfbergs Lila', normal_price: 7.20, net_weight: 500, data_source: 'Foodie.fi' },
  { name_finnish: 'Gevalia', normal_price: 6.80, net_weight: 450, data_source: 'S-Kaupat' },
  { name_finnish: 'Arvid Nordquist Classic', normal_price: 8.10, net_weight: 500, data_source: 'K-Ruoka' },
  { name_finnish: 'Paulig Brazil', normal_price: 7.50, net_weight: 500, data_source: 'Foodie.fi' },
  { name_finnish: 'Jacobs Krönung', normal_price: 6.25, net_weight: 500, data_source: 'S-Kaupat' },
];

// Reusable hook for managing sorting logic
const useSortableData = (items, config = null) => {
  const [sortConfig, setSortConfig] = useState(config);

  const sortedItems = useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
};


// Main App Component
export default function App() {
  const [coffees, setCoffees] = useState(mockCoffeeData);
  const [filterText, setFilterText] = useState('');
  
  // In a real app, you would fetch data here, e.g., inside a useEffect hook
  // useEffect(() => {
  //   fetch('/coffees')
  //     .then(response => response.json())
  //     .then(data => setCoffees(data));
  // }, []);

  const { items: sortedCoffees, requestSort, sortConfig } = useSortableData(coffees);

  const getSortDirectionSymbol = (name) => {
    if (!sortConfig || sortConfig.key !== name) {
      return ' ↕';
    }
    return sortConfig.direction === 'ascending' ? ' ↑' : ' ↓';
  };

  const filteredCoffees = useMemo(() => {
    if (!filterText) {
      return sortedCoffees;
    }
    return sortedCoffees.filter(coffee =>
      coffee.data_source.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [sortedCoffees, filterText]);

  return (
    <div className="bg-gray-900 min-h-screen p-4 sm:p-6 lg:p-8 font-sans text-white">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center text-amber-400">Coffee Prices</h1>
          <p className="text-center text-gray-400 mt-2">View, sort, and filter coffee products.</p>
        </header>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Filter by data source (e.g., K-Ruoka)..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-white"
          />
        </div>

        <div className="overflow-x-auto bg-gray-800 rounded-lg shadow-lg">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('name_finnish')}
                >
                  Product Name
                  <span className="ml-1">{getSortDirectionSymbol('name_finnish')}</span>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('normal_price')}
                >
                  Price (€)
                  <span className="ml-1">{getSortDirectionSymbol('normal_price')}</span>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('net_weight')}
                >
                  Net Weight (g)
                   <span className="ml-1">{getSortDirectionSymbol('net_weight')}</span>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => requestSort('data_source')}
                >
                  Data Source
                  <span className="ml-1">{getSortDirectionSymbol('data_source')}</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
              {filteredCoffees.length > 0 ? (
                filteredCoffees.map((coffee, index) => (
                  <tr key={index} className="hover:bg-gray-700/50 transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{coffee.name_finnish}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{coffee.normal_price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{coffee.net_weight}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{coffee.data_source}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
