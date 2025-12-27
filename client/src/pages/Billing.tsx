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
    Tag,
    Input
} from 'antd';
import { 
    PrinterOutlined, 
    EyeOutlined,
    SearchOutlined
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
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        const businessName = settings?.businessName || 'MilkyWay Dairy Services';
        const businessAddress = settings?.businessAddress || '123 Farm Lane, Countryside';
        const businessPhone = settings?.businessPhone || '+1 234 567 890';
        const currencySymbol = settings?.currencySymbol || '₹';
        const periodLabel = `${getMonthName(month)} ${year}`;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${invoice?.customer.name}</title>
              <style>
                body {
                  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                  padding: 40px;
                  max-width: 850px;
                  margin: 0 auto;
                  color: #333;
                  line-height: 1.5;
                }
                .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
                .title { color: #1a73e8; font-size: 32px; font-weight: bold; margin: 0; }
                .company-info p { margin: 2px 0; color: #666; font-size: 14px; }
                .bill-to { text-align: right; }
                .bill-to h3 { margin: 0; color: #888; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
                .bill-to p { margin: 4px 0; font-size: 16px; font-weight: 600; }
                .period { background: #f0f7ff; color: #1a73e8; padding: 5px 15px; border-radius: 4px; display: inline-block; margin-top: 10px; font-size: 13px; font-weight: 600; }
                
                .section-title { font-size: 18px; font-weight: bold; margin: 30px 0 15px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                .summary-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .summary-table td { padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
                .summary-table .label { color: #666; }
                .summary-table .value { text-align: right; font-weight: 600; }
                
                .total-box { background: #1a73e8; color: white; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
                .total-box h2 { margin: 0; font-size: 24px; }
                .total-box .amount { font-size: 28px; font-weight: bold; }
                
                .breakdown-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                .breakdown-table th { text-align: left; padding: 12px 8px; background: #fafafa; border-bottom: 2px solid #eee; font-size: 13px; color: #888; }
                .breakdown-table td { padding: 10px 8px; border-bottom: 1px solid #eee; font-size: 14px; }
                .breakdown-date { color: #666; }
                .breakdown-total { font-weight: bold; }
                
                .footer { margin-top: 60px; text-align: center; color: #aaa; font-size: 13px; border-top: 1px solid #eee; pt: 20px; }
                .signature { margin-top: 50px; display: flex; justify-content: flex-end; }
                .sig-line { border-top: 1px solid #333; width: 200px; text-align: center; padding-top: 5px; font-size: 12px; }

                @media print {
                  body { padding: 20px; }
                  .total-box { background: #1a73e8 !important; -webkit-print-color-adjust: exact; }
                }
              </style>
            </head>
            <body>
              <div class="header">
                <div class="company-info">
                  <h1 class="title">INVOICE</h1>
                  <p><strong>${businessName}</strong></p>
                  <p>${businessAddress}</p>
                  <p>Phone: ${businessPhone}</p>
                </div>
                <div class="bill-to">
                  <h3>Bill To</h3>
                  <p>${invoice?.customer.name}</p>
                  <p style="font-weight: normal; font-size: 13px; color: #666;">${invoice?.customer.address}</p>
                  <div class="period">Period: ${periodLabel}</div>
                </div>
              </div>

              <div class="section-title">Summary</div>
              <table class="summary-table">
                <tr>
                  <td class="label">Total Milk Delivered</td>
                  <td class="value">${invoice?.totalLiters.toFixed(1)} Liters</td>
                </tr>
                <tr>
                  <td class="label">Price per Liter</td>
                  <td class="value">${currencySymbol}${invoice?.customer.pricePerLiter.toFixed(2)}</td>
                </tr>
              </table>

              <div class="total-box">
                <h2>Total Amount Due</h2>
                <div class="amount">${formatCurrency(invoice!.totalAmount)}</div>
              </div>

              <div class="section-title">Daily Breakdown</div>
              <table class="breakdown-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Morning (L)</th>
                    <th>Evening (L)</th>
                    <th style="text-align: right">Total (L)</th>
                  </tr>
                </thead>
                <tbody>
                  ${invoice?.dailyBreakdown.map(day => `
                    <tr>
                      <td class="breakdown-date">${day.date}</td>
                      <td>${day.morning > 0 ? day.morning : '-'}</td>
                      <td>${day.evening > 0 ? day.evening : '-'}</td>
                      <td class="breakdown-total" style="text-align: right">${(day.morning + day.evening).toFixed(1)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div class="signature">
                <div class="sig-line">Authorized Signature</div>
              </div>

              <div class="footer">
                Thank you for your business! Please pay within ${settings?.paymentTermsDays || 5} days.
                <br>Generated on ${dayjs().format('DD/MM/YYYY HH:mm')}
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
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
      <div ref={printRef} className="p-6 bg-white overflow-y-auto max-h-[70vh]">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-blue-600 m-0">INVOICE</h1>
            <div className="mt-2 text-sm text-gray-500">
              <p className="m-0 font-bold">{settings?.businessName || 'MilkyWay Dairy Services'}</p>
              <p className="m-0">{settings?.businessAddress || '123 Farm Lane, Countryside'}</p>
              <p className="m-0">Phone: {settings?.businessPhone || '+1 234 567 890'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400 uppercase tracking-wider font-semibold m-0">Bill To</p>
            <p className="text-lg font-semibold text-gray-900 m-0">{invoice.customer.name}</p>
            <p className="text-sm text-gray-500 m-0">{invoice.customer.address}</p>
            <div className="mt-2 inline-block rounded bg-blue-50 px-3 py-1 text-xs text-blue-600 font-bold">
              Period: {periodLabel}
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6">
          <h2 className="font-semibold text-gray-900 text-base">Summary</h2>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Total Milk Delivered</span>
              <span className="font-semibold text-gray-900">
                {invoice.totalLiters.toFixed(1)} Liters
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-500">Price per Liter</span>
              <span className="font-semibold text-gray-900">
                {formatCurrency(invoice.customer.pricePerLiter)}
              </span>
            </div>
            <div className="flex justify-between rounded-xl bg-blue-600 p-5 mt-4 text-white shadow-lg shadow-blue-100">
              <span className="text-xl font-bold">Total Amount Due</span>
              <Text strong className="text-2xl font-bold text-white">
                {formatCurrency(invoice.totalAmount)}
              </Text>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <h2 className="border-b-2 border-gray-100 pb-2 font-semibold text-gray-900 text-base">
            Daily Breakdown
          </h2>
          <div className="mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-400 text-left">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Morning</th>
                  <th className="pb-3 font-medium">Evening</th>
                  <th className="pb-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.dailyBreakdown.map((day) => (
                  <tr key={day.date} className="group hover:bg-gray-50">
                    <td className="py-3 text-gray-500">{day.date}</td>
                    <td className="py-3">{day.morning > 0 ? `${day.morning} L` : '-'}</td>
                    <td className="py-3">{day.evening > 0 ? `${day.evening} L` : '-'}</td>
                    <td className="py-3 text-right font-semibold text-gray-900">
                      {(day.morning + day.evening).toFixed(1)} L
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-12 border-t border-gray-100 pt-8 text-center">
            <p className="text-gray-400 text-sm">Thank you for your business!</p>
            <p className="text-xs text-gray-300 mt-1 italic">Please pay within {settings?.paymentTermsDays || 5} days.</p>
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
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const filteredSummaries = summaries.filter(s => 
    s.customerName.toLowerCase().includes(searchText.toLowerCase())
  );

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

        <Space wrap>
          <Input
            placeholder="Search customer..."
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ width: 220 }}
            allowClear
          />
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
            dataSource={filteredSummaries}
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
