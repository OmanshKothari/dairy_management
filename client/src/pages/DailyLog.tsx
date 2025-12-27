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
  Progress
} from 'antd';
import { 
  ReloadOutlined, 
  DeleteOutlined, 
  SaveOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryApi, customerApi } from '../services/api';
import { Customer, DeliveryEntry, Shift } from '../types';

const { Option } = Select;
const { Title, Text } = Typography;

const DailyLog: React.FC = () => {
  const [date, setDate] = useState(dayjs());
  const [shift, setShift] = useState<Shift>(Shift.MORNING);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Map<string, DeliveryEntry>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const dateStr = date.format('YYYY-MM-DD');
      
      const [customersData, deliveriesData] = await Promise.all([
        customerApi.getAll(),
        deliveryApi.getByDate(dateStr, shift),
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
      message.error('Failed to load delivery data');
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
        delivered: existing?.delivered ?? true, // Auto-mark as delivered if quantity changed? Maybe keep as is.
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
    try {
      setIsSaving(true);
      const entries = Array.from(deliveries.values());
      await deliveryApi.bulkUpdate(date.format('YYYY-MM-DD'), shift, entries);
      message.success('Deliveries saved successfully');
    } catch (error) {
      console.error('Failed to save:', error);
      message.error('Failed to save deliveries');
    } finally {
      setIsSaving(false);
    }
  };

  const totalDelivered = Array.from(deliveries.values()).reduce(
    (sum, entry) => sum + (entry.delivered ? entry.quantity : 0),
    0
  );

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
      render: (_: any, record: Customer) => {
          const quota = shift === Shift.MORNING ? record.morningQuota : record.eveningQuota;
          return <Tag color="blue">{quota} L</Tag>;
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (_: any, record: Customer) => {
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
      render: (_: any, record: Customer, index: number) => {
          const entry = deliveries.get(record.id);
          return (
              <InputNumber
                id={`quantity-${index}`}
                min={0}
                step={0.5}
                value={entry?.quantity ?? 0}
                onChange={(val) => handleQuantityChange(record.id, val || 0)}
                disabled={!entry?.delivered}
                style={{ width: 80 }}
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
              <Text type="secondary" className="block text-xs">Total Delivered</Text>
              <Text strong className="text-lg">{totalDelivered.toFixed(1)} L</Text>
            </div>
            <Button 
                type="primary" 
                onClick={handleSave} 
                loading={isSaving}
                icon={<SaveOutlined />}
                size="large"
            >
              Save Changes
            </Button>
          </Space>
        </div>

        <Table
            dataSource={customers}
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
