import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Calendar, Trash2 } from 'lucide-react';
import { Card, Button, LoadingSpinner } from '../components/ui';
import { stockApi } from '../services/api';
import { Stock as StockType, StockFormData, StockSource, Shift } from '../types';
import { getTodayString, formatDate } from '../utils/helpers';
import { useSettings } from '../contexts/SettingsContext';
import toast from 'react-hot-toast';

const STOCK_SOURCES: { value: StockSource; label: string }[] = [
  { value: StockSource.FARM_A, label: 'Farm A' },
  { value: StockSource.FARM_B, label: 'Farm B' },
  { value: StockSource.MARKET, label: 'Market' },
  { value: StockSource.OTHER, label: 'Other' },
];

const getSourceLabel = (source: StockSource): string => {
  return STOCK_SOURCES.find((s) => s.value === source)?.label || source;
};

const Stock: React.FC = () => {
  const { settings } = useSettings();
  const [stocks, setStocks] = useState<StockType[]>([]);
  const [inventory, setInventory] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<StockFormData>({
    date: getTodayString(),
    shift: Shift.MORNING,
    source: StockSource.FARM_A,
    quantity: 0,
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [stocksData, inventoryData] = await Promise.all([
        stockApi.getAll(),
        stockApi.getInventory(),
      ]);
      setStocks(stocksData);
      setInventory(inventoryData.currentInventory);
    } catch (error) {
      console.error('Failed to fetch stock data:', error);
      toast.error('Failed to load stock data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (field: keyof StockFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    try {
      setIsSaving(true);
      await stockApi.create(formData);
      toast.success('Stock recorded successfully');
      setFormData((prev) => ({ ...prev, quantity: 0 }));
      await fetchData();
    } catch (error) {
      console.error('Failed to save stock:', error);
      toast.error('Failed to save stock');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await stockApi.delete(id);
      toast.success('Stock entry deleted');
      await fetchData();
    } catch (error) {
      console.error('Failed to delete stock:', error);
      toast.error('Failed to delete stock');
    }
  };

  const maxCapacity = settings?.maxCapacity || 2000;
  const inventoryPercentage = Math.min((inventory / maxCapacity) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Card>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Plus className="h-5 w-5 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Record Collection</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Shift</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => handleChange('shift', e.target.value as Shift)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="MORNING">Morning</option>
                    <option value="EVENING">Evening</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => handleChange('source', e.target.value as StockSource)}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {STOCK_SOURCES.map((source) => (
                      <option key={source.value} value={source.value}>
                        {source.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Quantity Collected (Liters)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={formData.quantity || ''}
                  onChange={(e) => handleChange('quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <Button
                type="submit"
                isLoading={isSaving}
                className="w-full"
                variant="success"
              >
                Save Record
              </Button>
            </form>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white"
          >
            <div
              className="absolute right-0 top-0 h-full w-1/3 bg-contain bg-right bg-no-repeat opacity-20"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'white\'%3E%3Cpath d=\'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93s3.06-7.44 7-7.93v15.86zm2-15.86c3.94.49 7 3.85 7 7.93s-3.06 7.44-7 7.93V4.07z\'/%3E%3C/svg%3E")',
              }}
            />
            <p className="text-sm font-medium text-blue-100">Current Inventory</p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-5xl font-bold">{inventory.toFixed(1)}</span>
              <span className="text-xl font-medium text-blue-200">Liters</span>
            </div>
            <div className="mt-4">
              <div className="h-2 overflow-hidden rounded-full bg-blue-500/30">
                <div
                  className="h-full rounded-full bg-white transition-all duration-500"
                  style={{ width: `${inventoryPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-blue-100">
                {inventoryPercentage.toFixed(0)}% of max capacity (Est.)
              </p>
            </div>
          </motion.div>

          <Card>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Recent Collections
            </h3>

            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : stocks.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">No collections recorded</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
                {stocks.slice(0, 10).map((stock, index) => (
                  <motion.div
                    key={stock.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{getSourceLabel(stock.source)}</p>
                      <p className="text-xs text-gray-500">
                        {formatDate(stock.date)} ({stock.shift === 'MORNING' ? 'Morning' : 'Evening'})
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-green-600">+{stock.quantity} L</span>
                      <button
                        onClick={() => handleDelete(stock.id)}
                        className="rounded p-1 text-gray-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Stock;
