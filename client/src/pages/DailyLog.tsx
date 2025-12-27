import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Trash2, Calendar } from 'lucide-react';
import { Card, Button, LoadingSpinner } from '../components/ui';
import { deliveryApi, customerApi } from '../services/api';
import { Customer, DeliveryEntry, Shift } from '../types';
import { getTodayString } from '../utils/helpers';
import toast from 'react-hot-toast';

interface DeliveryRowProps {
  customer: Customer;
  entry: DeliveryEntry | undefined;
  shift: Shift;
  onToggle: (customerId: string, delivered: boolean) => void;
  onQuantityChange: (customerId: string, quantity: number) => void;
}

const DeliveryRow: React.FC<DeliveryRowProps> = ({
  customer,
  entry,
  shift,
  onToggle,
  onQuantityChange,
}) => {
  const quota = shift === Shift.MORNING ? customer.morningQuota : customer.eveningQuota;
  const isDelivered = entry?.delivered ?? false;
  const actualQuantity = entry?.quantity ?? 0;

  const handleToggle = () => {
    const newDelivered = !isDelivered;
    onToggle(customer.id, newDelivered);
    if (newDelivered && actualQuantity === 0) {
      onQuantityChange(customer.id, quota);
    } else if (!newDelivered) {
      onQuantityChange(customer.id, 0);
    }
  };

  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="border-b border-gray-100 last:border-0"
    >
      <td className="py-4 pr-4">
        <div>
          <p className="font-semibold text-gray-900">{customer.name}</p>
          <p className="text-sm text-gray-500">{customer.address}</p>
        </div>
      </td>
      <td className="px-4 py-4 text-center">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700">
          {quota} L
        </span>
      </td>
      <td className="px-4 py-4 text-center">
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isDelivered ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={isDelivered}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isDelivered ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </td>
      <td className="pl-4 py-4">
        <input
          type="number"
          min="0"
          step="0.5"
          value={actualQuantity}
          onChange={(e) => onQuantityChange(customer.id, parseFloat(e.target.value) || 0)}
          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
    </motion.tr>
  );
};

const DailyLog: React.FC = () => {
  const [date, setDate] = useState(getTodayString());
  const [shift, setShift] = useState<Shift>(Shift.MORNING);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Map<string, DeliveryEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [customersData, deliveriesData] = await Promise.all([
        customerApi.getAll(),
        deliveryApi.getByDate(date, shift),
      ]);

      setCustomers(customersData.filter((c: Customer) => c.isActive));

      const deliveryMap = new Map<string, DeliveryEntry>();
      deliveriesData.forEach((d: { customerId: string; delivered: boolean; quantity?: number; actualAmount?: number }) => {
        deliveryMap.set(d.customerId, {
          customerId: d.customerId,
          delivered: d.delivered,
          quantity: d.quantity ?? d.actualAmount ?? 0,
        });
      });
      setDeliveries(deliveryMap);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load delivery data');
    } finally {
      setIsLoading(false);
    }
  }, [date, shift]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleToggle = (customerId: string, delivered: boolean) => {
    setDeliveries((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(customerId);
      newMap.set(customerId, {
        customerId,
        delivered,
        quantity: existing?.quantity ?? 0,
      });
      return newMap;
    });
  };

  const handleQuantityChange = (customerId: string, quantity: number) => {
    setDeliveries((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(customerId);
      newMap.set(customerId, {
        customerId,
        delivered: existing?.delivered ?? false,
        quantity,
      });
      return newMap;
    });
  };

  const handleAutofillAll = async () => {
    try {
      setIsSaving(true);
      await deliveryApi.autofill(date, shift);
      toast.success('Deliveries autofilled from quotas');
      await fetchData();
    } catch (error) {
      console.error('Failed to autofill:', error);
      toast.error('Failed to autofill deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSaving(true);
      await deliveryApi.clear(date, shift);
      toast.success('Deliveries cleared');
      await fetchData();
    } catch (error) {
      console.error('Failed to clear:', error);
      toast.error('Failed to clear deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const entries = Array.from(deliveries.values());
      await deliveryApi.bulkUpdate(date, shift, entries);
      toast.success('Deliveries saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const totalDelivered = Array.from(deliveries.values()).reduce(
    (sum, entry) => sum + (entry.delivered ? entry.quantity : 0),
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Delivery Log</h1>
          <p className="mt-1 text-gray-500">Track morning & evening deliveries</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="inline-flex rounded-lg border border-gray-300 p-1">
            <button
              onClick={() => setShift(Shift.MORNING)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                shift === Shift.MORNING
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Morning
            </button>
            <button
              onClick={() => setShift(Shift.EVENING)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                shift === Shift.EVENING
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Evening
            </button>
          </div>
        </div>
      </div>

      <Card>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleAutofillAll}
              isLoading={isSaving}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Autofill All
            </Button>
            <Button
              variant="ghost"
              onClick={handleClear}
              isLoading={isSaving}
              leftIcon={<Trash2 className="h-4 w-4" />}
            >
              Clear
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              Total: <span className="text-lg font-bold text-gray-900">{totalDelivered.toFixed(1)}</span>{' '}
              <span className="font-medium">L</span>
            </div>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save Changes
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : customers.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-gray-500">No active customers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="pb-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Quota
                  </th>
                  <th className="pb-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Status
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actual (L)
                  </th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <DeliveryRow
                    key={customer.id}
                    customer={customer}
                    entry={deliveries.get(customer.id)}
                    shift={shift}
                    onToggle={handleToggle}
                    onQuantityChange={handleQuantityChange}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DailyLog;
