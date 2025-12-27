import React, { useState, useEffect, useRef } from 'react';
import { 
    Button, 
    Card, 
    Table, 
    Modal, 
    Select, 
    Space, 
    Typography, 
    message,
    Tag
} from 'antd';
import { 
    PrinterOutlined, 
    EyeOutlined 
} from '@ant-design/icons';
import { useSettings } from '../contexts/SettingsContext';
import { billingApi } from '../services/api';
import { CustomerBillingSummary, CustomerInvoice } from '../types';
import { getMonthName } from '../utils/helpers';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

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
    <Modal 
        open={isOpen} 
        onCancel={onClose} 
        width={800} 
        title="Invoice Preview"
        footer={[
            <Button key="close" onClick={onClose}>Close</Button>,
            <Button key="print" type="primary" icon={<PrinterOutlined />} onClick={handlePrint}>Print Invoice</Button>
        ]}
    >
      <div ref={printRef} className="p-6 bg-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 m-0">INVOICE</h1>
            <div className="mt-2 text-sm text-gray-500">
              <p className="m-0">{settings?.businessName || 'MilkyWay Dairy Services'}</p>
              <p className="m-0">{settings?.businessAddress || '123 Farm Lane, Countryside'}</p>
              <p className="m-0">Phone: {settings?.businessPhone || '+1 234 567 890'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500 m-0">Bill To:</p>
            <p className="text-lg font-semibold text-gray-900 m-0">{invoice.customer.name}</p>
            <p className="text-sm text-gray-500 m-0">{invoice.customer.address}</p>
            <div className="mt-2 inline-block rounded bg-blue-50 px-3 py-1 text-xs text-blue-600">
              <span className="font-medium">Period: </span>
              <span>{periodLabel}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-6">
          <h2 className="font-semibold text-gray-900 text-base">Summary</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Total Milk Delivered</span>
              <span className="font-medium text-gray-900">
                {invoice.totalLiters.toFixed(1)} Liters
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-600">Price per Liter</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(invoice.customer.pricePerLiter)}
              </span>
            </div>
            <div className="flex justify-between rounded-lg bg-blue-50 p-4 mt-2">
              <span className="text-lg font-bold text-blue-600">Total Due</span>
              <span className="text-lg font-bold text-blue-600">
                {formatCurrency(invoice.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="border-b-2 border-gray-200 pb-2 font-semibold text-gray-900 text-base">
            Daily Breakdown
          </h2>
          <div className="mt-4 max-h-64 overflow-y-auto">
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
  const currentDate = dayjs();
  const [month, setMonth] = useState(currentDate.month() + 1);
  const [year, setYear] = useState(currentDate.year());
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
      message.error('Failed to load billing data');
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
      message.error('Failed to load invoice');
    } finally {
      setIsLoadingInvoice(false);
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.year() - 2 + i);
  
  const columns = [
      {
          title: 'Customer',
          dataIndex: 'customerName',
          key: 'customerName',
          render: (text: string) => <Text strong>{text}</Text>
      },
      {
          title: 'Total Liters',
          dataIndex: 'totalLiters',
          key: 'totalLiters',
          align: 'center' as const,
          render: (val: number) => <Tag color="blue">{val.toFixed(1)} L</Tag>
      },
      {
          title: 'Rate',
          dataIndex: 'pricePerLiter',
          key: 'pricePerLiter',
          align: 'center' as const,
          render: (val: number) => <Text>{formatCurrency(val)}</Text>
      },
      {
          title: 'Total Amount',
          dataIndex: 'totalAmount',
          key: 'totalAmount',
          align: 'center' as const,
          render: (val: number) => <Text strong type="success">{formatCurrency(val)}</Text>
      },
      {
          title: 'Actions',
          key: 'actions',
          align: 'center' as const,
          render: (_: any, record: CustomerBillingSummary) => (
              <Button 
                type="link" 
                icon={<EyeOutlined />} 
                onClick={() => handleViewBill(record.customerId)}
                loading={isLoadingInvoice}
              >
                  View Bill
              </Button>
          )
      }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Title level={2} style={{ margin: 0 }}>Monthly Billing</Title>
        </div>

        <Space>
          <Select
            value={month}
            onChange={(val) => setMonth(val)}
            style={{ width: 120 }}
          >
            {months.map((m, i) => (
              <Option key={m} value={i + 1}>
                {m}
              </Option>
            ))}
          </Select>
          <Select
            value={year}
            onChange={(val) => setYear(val)}
            style={{ width: 100 }}
          >
            {years.map((y) => (
              <Option key={y} value={y}>
                {y}
              </Option>
            ))}
          </Select>
        </Space>
      </div>

      <Card bodyStyle={{ padding: 0 }}>
        <Table
            dataSource={summaries}
            columns={columns}
            rowKey="customerId"
            loading={isLoading}
            pagination={false}
        />
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
