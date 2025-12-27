import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Printer, X } from 'lucide-react';
import { Card, Button, Modal, LoadingSpinner, EmptyState } from '../components/ui';
import { useSettings } from '../contexts/SettingsContext';
import { billingApi } from '../services/api';
import { CustomerBillingSummary, CustomerInvoice } from '../types';
import { getMonthName } from '../utils/helpers';
import toast from 'react-hot-toast';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: CustomerInvoice | null;
  month: number;
  year: number;
  settings: any;
  formatCurrency: (amount: number) => string;
}

const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  invoice,
  month,
  year,
  settings,
  formatCurrency,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (printRef.current) {
      const printContents = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${invoice?.customer.name}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                  padding: 40px;
                  max-width: 800px;
                  margin: 0 auto;
                  color: #1f2937;
                }
                .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .invoice-title { color: #2563eb; font-size: 28px; font-weight: 700; margin: 0; }
                .company-info { font-size: 14px; color: #4b5563; }
                .bill-to { text-align: right; }
                .bill-to-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
                .bill-to-name { font-size: 18px; font-weight: 600; }
                .period-badge { background: #eff6ff; color: #2563eb; padding: 4px 12px; border-radius: 4px; font-size: 12px; display: inline-block; margin-top: 8px; }
                .summary-section { margin: 30px 0; }
                .summary-title { font-weight: 600; font-size: 16px; margin-bottom: 12px; }
                .summary-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e5e7eb; }
                .total-row { background: #eff6ff; padding: 16px; border-radius: 8px; display: flex; justify-content: space-between; font-weight: 700; color: #2563eb; font-size: 18px; margin: 20px 0; }
                .breakdown-section { margin-top: 30px; }
                .breakdown-title { font-weight: 600; font-size: 16px; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
                .breakdown-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; }
                .breakdown-date { color: #6b7280; }
                .breakdown-amounts { display: flex; gap: 24px; }
                .breakdown-amount { color: #6b7280; }
                .breakdown-total { font-weight: 600; }
                .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 14px; }
              </style>
            </head>
            <body>
              ${printContents}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  if (!invoice) return null;

  const periodLabel = `${getMonthName(month)} ${year}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" title="Invoice">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <Button onClick={handlePrint} leftIcon={<Printer className="h-4 w-4" />}>
          Print
        </Button>
        <button
          onClick={onClose}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div ref={printRef} className="p-6">
        <div className="flex justify-between">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">INVOICE</h1>
            <div className="mt-2 text-sm text-gray-500">
              <p>{settings?.businessName || 'MilkyWay Dairy Services'}</p>
              <p>{settings?.businessAddress || '123 Farm Lane, Countryside'}</p>
              <p>Phone: {settings?.businessPhone || '+1 234 567 890'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Bill To:</p>
            <p className="text-lg font-semibold text-gray-900">{invoice.customer.name}</p>
            <p className="text-sm text-gray-500">{invoice.customer.address}</p>
            <div className="mt-2 inline-block rounded bg-blue-50 px-3 py-1 text-xs text-blue-600">
              <p className="font-medium">Period:</p>
              <p>{periodLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="font-semibold text-gray-900">Summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Total Milk Delivered</span>
              <span className="font-medium text-gray-900">
                {invoice.totalLiters.toFixed(1)} Liters
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Price per Liter</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.customer.pricePerLiter)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-blue-50 p-4">
              <span className="text-lg font-bold text-blue-600">Total Due</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="border-b-2 border-gray-200 pb-2 font-semibold text-gray-900">
            Daily Breakdown
          </h2>
          <div className="mt-4 max-h-64 overflow-y-auto custom-scrollbar">
            {invoice.dailyBreakdown.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between border-b border-gray-100 py-2 text-sm"
              >
                <span className="text-gray-500">{day.date}</span>
                <div className="flex items-center gap-6">
                  {day.morning > 0 && (
                    <span className="text-gray-500">{day.morning} L (M)</span>
                  )}
                  {day.evening > 0 && (
                    <span className="text-gray-500">{day.evening} L (E)</span>
                  )}
                  <span className="font-semibold text-gray-900">
                    {(day.morning + day.evening).toFixed(1)} L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          Thank you for your business! Please pay within {settings?.paymentTermsDays || 5} days.
        </div>
      </div>
    </Modal>
  );
};

const Billing: React.FC = () => {
  const { settings, formatCurrency } = useSettings();
  const currentDate = new Date();
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentDate.getFullYear());
  const [summaries, setSummaries] = useState<CustomerBillingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<CustomerInvoice | null>(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);

  const fetchBilling = async () => {
    try {
      setIsLoading(true);
      const data = await billingApi.getMonthly(year, month);
      setSummaries(data);
    } catch (error) {
      console.error('Failed to fetch billing:', error);
      toast.error('Failed to load billing data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBilling();
  }, [month, year]);

  const handleViewBill = async (customerId: string) => {
    try {
      setIsLoadingInvoice(true);
      const invoice = await billingApi.getCustomerInvoice(customerId, year, month);
      setSelectedInvoice(invoice);
    } catch (error) {
      console.error('Failed to load invoice:', error);
      toast.error('Failed to load invoice');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Monthly Billing</h1>
        </div>

        <div className="flex gap-3">
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {months.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-12">
            <EmptyState
              icon={<FileText className="h-8 w-8" />}
              title="No billing data"
              description={`No deliveries recorded for ${months[month - 1]} ${year}`}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Customer
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Liters
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Rate
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Total Amount
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((summary, index) => (
                  <motion.tr
                    key={summary.customerId}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 last:border-0"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900">{summary.customerName}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-semibold text-blue-600">
                        {summary.totalLiters.toFixed(1)} L
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-500">
                      {formatCurrency(summary.pricePerLiter)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-gray-900">
                        {formatCurrency(summary.totalAmount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleViewBill(summary.customerId)}
                        disabled={isLoadingInvoice}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                      >
                        View Bill
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <InvoiceModal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        invoice={selectedInvoice}
        month={month}
        year={year}
        settings={settings}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default Billing;
