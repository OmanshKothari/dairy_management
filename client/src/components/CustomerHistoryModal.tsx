import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Table, DatePicker, Space, Tag, Typography, Button, Empty } from 'antd';
import { CalendarOutlined, FilterOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { deliveryApi } from '../services/api';
import { Customer, Delivery, Shift } from '../types';

const { RangePicker } = DatePicker;
const { Text } = Typography;

interface CustomerHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

const CustomerHistoryModal: React.FC<CustomerHistoryModalProps> = ({
  isOpen,
  onClose,
  customer,
}) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const fetchHistory = useCallback(async () => {
    if (!customer) return;
    
    try {
      setIsLoading(true);
      const startStr = dateRange[0].format('YYYY-MM-DD');
      const endStr = dateRange[1].format('YYYY-MM-DD');
      const data = await deliveryApi.getByCustomer(customer.id, startStr, endStr);
      setDeliveries(data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    } finally {
      setIsLoading(false);
    }
  }, [customer, dateRange]);

  useEffect(() => {
    if (isOpen && customer) {
      fetchHistory();
    }
  }, [isOpen, customer, fetchHistory]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD MMM YYYY'),
      sorter: (a: Delivery, b: Delivery) => dayjs(a.date).unix() - dayjs(b.date).unix(),
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift: Shift) => (
        <Tag color={shift === Shift.MORNING ? 'orange' : 'blue'}>
          {shift}
        </Tag>
      ),
    },
    {
      title: 'Quantity',
      dataIndex: 'actualAmount',
      key: 'actualAmount',
      render: (val: number) => <Text strong>{val.toFixed(1)} L</Text>,
    },
    {
      title: 'Status',
      dataIndex: 'delivered',
      key: 'delivered',
      render: (delivered: boolean) => (
        <Tag color={delivered ? 'success' : 'error'}>
          {delivered ? 'Delivered' : 'Pending'}
        </Tag>
      ),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true,
      render: (notes: string) => <Text type="secondary">{notes || '-'}</Text>,
    }
  ];

  return (
    <Modal
      title={
        <Space>
          <CalendarOutlined />
          <span>Delivery History: {customer?.name}</span>
        </Space>
      }
      open={isOpen}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
      destroyOnClose
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
          <Space>
            <FilterOutlined className="text-gray-400" />
            <Text type="secondary">Filter Range:</Text>
            <RangePicker 
              value={dateRange} 
              onChange={(vals) => vals && setDateRange([vals[0]!, vals[1]!])} 
              allowClear={false}
            />
          </Space>
          <div className="text-right">
            <Text type="secondary" className="block text-xs uppercase">Total Liters</Text>
            <Text strong className="text-lg">
              {deliveries.reduce((sum, d) => sum + (d.quantity || 0), 0).toFixed(1)} L
            </Text>
          </div>
        </div>

        <Table
          dataSource={deliveries}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={{ pageSize: 10 }}
          size="middle"
          locale={{ emptyText: <Empty description="No deliveries found in this period" /> }}
        />
      </div>
    </Modal>
  );
};

export default CustomerHistoryModal;
