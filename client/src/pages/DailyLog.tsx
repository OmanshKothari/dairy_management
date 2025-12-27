import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  DatePicker, 
  Select, 
  Space, 
  Tag, 
  Switch, 
  InputNumber, 
  Typography,
  message,
  Progress,
  Alert,
  Tooltip,
  Modal,
  Input
} from 'antd';
import { 
  ReloadOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryApi, customerApi, stockApi } from '../services/api';
import { Customer, DeliveryEntry, Shift } from '../types';

const { Option } = Select;
const { Title, Text } = Typography;

interface StockInfo {
  totalStock: number;
  totalDelivered: number; // Already delivered in OTHER shifts for this date
}

const DailyLog: React.FC = () => {
  const [date, setDate] = useState(dayjs());
  const [shift, setShift] = useState<Shift>(Shift.MORNING);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchText, setSearchText] = useState('');
  const [deliveries, setDeliveries] = useState<Map<string, DeliveryEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo>({ totalStock: 0, totalDelivered: 0 });

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      
      const [customersData, deliveriesData, stockData] = await Promise.all([
        customerApi.getAll(),
        deliveryApi.getByDate(dateStr, shift),
        stockApi.getAvailability(dateStr),
      ]);

      setCustomers(customersData.filter((c: Customer) => c.isActive));
      setStockInfo(stockData);

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
      message.error('Failed to load delivery data');
    } finally {
      setIsLoading(false);
    }
  }, [date, shift]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchText.toLowerCase()) ||
    c.address.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleToggle = (customerId: string, delivered: boolean) => {
    setDeliveries((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(customerId);
      const customer = customers.find(c => c.id === customerId);
      const quota = shift === Shift.MORNING ? customer?.morningQuota : customer?.eveningQuota;
      
      // Auto-set quantity to quota if marking as delivered and quantity is 0
      let quantity = existing?.quantity ?? 0;
      if (delivered && quantity === 0) {
          quantity = quota || 0;
      } else if (!delivered) {
          quantity = 0;
      }

      newMap.set(customerId, {
        customerId,
        delivered,
        quantity,
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
        delivered: existing?.delivered ?? true,
        quantity,
      });
      return newMap;
    });
  };

  const handleAutofillAll = async () => {
    try {
      setIsSaving(true);
      await deliveryApi.autofill(date.format('YYYY-MM-DD'), shift);
      message.success('Deliveries autofilled from quotas');
      await fetchData();
    } catch (error) {
      console.error('Failed to autofill:', error);
      message.error('Failed to autofill deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = async () => {
    try {
      setIsSaving(true);
      await deliveryApi.clear(date.format('YYYY-MM-DD'), shift);
      message.success('Deliveries cleared');
      await fetchData();
    } catch (error) {
      console.error('Failed to clear:', error);
      message.error('Failed to clear deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    // Check for stock overflow before saving
    if (remainingStock < 0) {
      Modal.confirm({
        title: 'Stock Overflow Warning',
        icon: <ExclamationCircleOutlined />,
        content: `You are trying to deliver ${Math.abs(remainingStock).toFixed(1)}L more than available stock. Are you sure you want to proceed?`,
        okText: 'Save Anyway',
        okType: 'danger',
        cancelText: 'Cancel',
        onOk: async () => {
          await performSave();
        },
      });
    } else {
      await performSave();
    }
  };

  const performSave = async () => {
    try {
      setIsSaving(true);
      const entries = Array.from(deliveries.values());
      await deliveryApi.bulkUpdate(date.format('YYYY-MM-DD'), shift, entries);
      message.success('Deliveries saved successfully');
      await fetchData(); // Refresh to update stock info
    } catch (error) {
      console.error('Failed to save:', error);
      message.error('Failed to save deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals for validation
  const currentShiftTotal = Array.from(deliveries.values()).reduce(
    (sum, entry) => sum + (entry.delivered ? entry.quantity : 0),
    0
  );

  // Remaining stock = Total Stock In - Already Delivered (other shifts) - Current Shift Allocation
  // Note: stockInfo.totalDelivered includes ALL shifts for the date. 
  // We need to be careful: if this shift's data is already saved, it's included in totalDelivered.
  // For a cleaner approach, we calculate based on what user sees: totalStock - currentShiftTotal
  // BUT we also need to account for other shifts. Let's simplify:
  // Remaining = TotalStock - (what's currently allocated in this view)
  const remainingStock = stockInfo.totalStock - currentShiftTotal;

  const totalDeliveredCustomers = Array.from(deliveries.values()).filter(d => d.delivered).length;
  const completionPercentage = Math.round((totalDeliveredCustomers / customers.length) * 100) || 0;

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: Customer) => (
          <div>
              <div className="font-medium">{text}</div>
              <div className="text-xs text-gray-500">{record.address}</div>
          </div>
      )
    },
    {
      title: 'Quota',
      key: 'quota',
      render: (_: unknown, record: Customer) => {
          const quota = shift === Shift.MORNING ? record.morningQuota : record.eveningQuota;
          return <Tag color="blue">{quota} L</Tag>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: unknown, record: Customer) => {
          const entry = deliveries.get(record.id);
          const isDelivered = entry?.delivered ?? false;
          return (
              <Switch 
                checked={isDelivered}
                onChange={(checked) => handleToggle(record.id, checked)}
                checkedChildren="Delivered"
                unCheckedChildren="Pending"
              />
          );
      }
    },
    {
      title: 'Actual (L)',
      key: 'quantity',
      render: (_: unknown, record: Customer, index: number) => {
          const entry = deliveries.get(record.id);
          const quota = shift === Shift.MORNING ? record.morningQuota : record.eveningQuota;
          const quantity = entry?.quantity ?? 0;
          const exceedsQuota = quantity > quota && quota > 0;

          return (
              <Tooltip title={exceedsQuota ? `Exceeds quota of ${quota}L` : ''} open={exceedsQuota ? undefined : false}>
                <InputNumber
                  id={`quantity-${index}`}
                  min={0}
                  step={0.5}
                  value={quantity}
                  onChange={(val) => handleQuantityChange(record.id, val || 0)}
                  disabled={!entry?.delivered}
                  style={{ width: 80 }}
                  status={exceedsQuota ? 'warning' : undefined}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          e.preventDefault();
                          const nextInput = document.getElementById(`quantity-${index + 1}`);
                          if (nextInput) {
                              (nextInput as HTMLInputElement).focus();
                              (nextInput as HTMLInputElement).select();
                          }
                      }
                  }}
                />
              </Tooltip>
          );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Title level={2} style={{ margin: 0 }}>Daily Delivery Log</Title>
          <Text type="secondary">Track morning & evening deliveries</Text>
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
          <DatePicker 
            value={date} 
            onChange={(val) => setDate(val || dayjs())} 
            allowClear={false}
            format="DD MMM YYYY"
          />
          
          <Select 
            value={shift} 
            onChange={(val) => setShift(val)} 
            style={{ width: 120 }}
          >
            <Option value={Shift.MORNING}>Morning</Option>
            <Option value={Shift.EVENING}>Evening</Option>
          </Select>
        </Space>
      </div>

      {/* Stock Alert */}
      {remainingStock < 0 && (
        <Alert
          message="Stock Overflow"
          description={`You are allocating ${Math.abs(remainingStock).toFixed(1)}L more than available stock (${stockInfo.totalStock.toFixed(1)}L). Please reduce quantities or add more stock.`}
          type="error"
          showIcon
          icon={<WarningOutlined />}
        />
      )}

      <Card>
        <div className="mb-4">
             <div className="flex justify-between mb-2">
                 <Text strong>Shift Progress</Text>
                 <Text>{completionPercentage}% Completed</Text>
             </div>
             <Progress percent={completionPercentage} status="active" />
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <Space>
            <Button 
                onClick={handleAutofillAll} 
                loading={isSaving}
                icon={<ReloadOutlined />}
            >
              Autofill All
            </Button>
            <Button 
                onClick={handleClear} 
                loading={isSaving}
                icon={<DeleteOutlined />}
            >
              Clear
            </Button>
          </Space>

          <Space size="large">
            <div className="text-right">
              <Text type="secondary" className="block text-xs">Stock Available</Text>
              <Text strong className={`text-lg ${remainingStock < 0 ? 'text-red-500' : ''}`}>
                {stockInfo.totalStock.toFixed(1)} L
              </Text>
            </div>
            <div className="text-right">
              <Text type="secondary" className="block text-xs">Total Allocated</Text>
              <Text strong className={`text-lg ${remainingStock < 0 ? 'text-red-500' : ''}`}>
                {currentShiftTotal.toFixed(1)} L
              </Text>
            </div>
            <Button 
                type="primary" 
                onClick={handleSave} 
                loading={isSaving}
                icon={<SaveOutlined />}
                size="large"
                danger={remainingStock < 0}
            >
              Save Changes
            </Button>
          </Space>
        </div>

        <Table
            dataSource={filteredCustomers}
            columns={columns}
            rowKey="id"
            loading={isLoading}
            pagination={false}
            scroll={{ y: 600 }}
            size="middle"
        />
      </Card>
    </div>
  );
};

export default DailyLog;
