import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Form, 
  InputNumber, 
  Select, 
  DatePicker, 
  Space, 
  Tag, 
  Popconfirm,
  Statistic,
  Row,
  Col,
  message
} from 'antd';
import { 
  PlusOutlined, 
  DeleteOutlined, 
  ExperimentOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { stockApi } from '../services/api';
import { Stock as StockType, StockFormData, Shift } from '../types';
import { useSettings } from '../contexts/SettingsContext';

const { Option } = Select;

const Stock: React.FC = () => {
  const { settings } = useSettings();
  const [form] = Form.useForm();
  
  const [stocks, setStocks] = useState<StockType[]>([]);
  const [sourcesList, setSourcesList] = useState<any[]>([]);
  const [inventory, setInventory] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch initial data
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
      message.error('Failed to load stock data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSources = async () => {
      try {
          const sourcesRes = await stockApi.getSources();
          setSourcesList(sourcesRes);
      } catch (error) {
          console.error("Failed to fetch sources", error);
      }
  };

  useEffect(() => {
    fetchSources();
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setIsSaving(true);
      const payload: StockFormData = {
          date: values.date.format('YYYY-MM-DD'),
          shift: values.shift,
          source: values.source,
          quantity: values.quantity
      };
      
      await stockApi.create(payload);
      message.success('Stock recorded successfully');
      form.resetFields();
      
      // Reset date to today and shift to morning default
      form.setFieldsValue({
          date: dayjs(),
          shift: Shift.MORNING
      });
      
      await fetchData();
    } catch (error: any) {
      console.error('Failed to save stock:', error);
      message.error(error.message || 'Failed to save stock');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await stockApi.delete(id);
      message.success('Stock entry deleted');
      await fetchData();
    } catch (error) {
      console.error('Failed to delete stock:', error);
      message.error('Failed to delete stock');
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (text: string) => dayjs(text).format('DD MMM YYYY'),
    },
    {
      title: 'Shift',
      dataIndex: 'shift',
      key: 'shift',
      render: (shift: string) => (
        <Tag color={shift === 'MORNING' ? 'orange' : 'blue'}>
          {shift}
        </Tag>
      ),
    },
    {
      title: 'Source',
      dataIndex: 'sourceName', // Use sourceName for display
      key: 'sourceName',
      render: (text: string, record: StockType) => text || record.source,
    },
    {
      title: 'Quantity (L)',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => <span className="font-medium text-green-600">+{val} L</span>,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: StockType) => (
        <Popconfirm
          title="Delete stock entry?"
          description="Are you sure to delete this entry?"
          onConfirm={() => handleDelete(record.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Row gutter={[24, 24]}>
        {/* Entry Form */}
        <Col xs={24} lg={14}>
          <Card 
            title={
                <Space>
                    <PlusOutlined className="text-blue-600" />
                    <span>Record Collection</span>
                </Space>
            } 
            className="shadow-sm"
          >
            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              initialValues={{
                date: dayjs(),
                shift: Shift.MORNING,
              }}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="date"
                    label="Date"
                    rules={[{ required: true, message: 'Please select date' }]}
                  >
                    <DatePicker className="w-full" format="DD MMM YYYY" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="shift"
                    label="Shift"
                    rules={[{ required: true, message: 'Please select shift' }]}
                  >
                    <Select>
                      <Option value={Shift.MORNING}>Morning</Option>
                      <Option value={Shift.EVENING}>Evening</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="source"
                    label="Source"
                    rules={[{ required: true, message: 'Please select source' }]}
                  >
                    <Select placeholder="Select Source">
                      {sourcesList.map(src => (
                          <Option key={src.id || src.value || src.name} value={src.name}>{src.name}</Option>
                      ))}
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="quantity"
                    label="Quantity Collected (L)"
                    rules={[
                        { required: true, message: 'Enter quantity' },
                        { type: 'number', min: 0.1, message: 'Must be greater than 0' }
                    ]}
                  >
                    <InputNumber className="w-full" step={0.5} placeholder="e.g. 50" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item>
                <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={isSaving} 
                    block
                    size="large"
                    icon={<PlusOutlined />}
                >
                  Save Record
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>

        {/* Info & Recent */}
        <Col xs={24} lg={10}>
             <Space direction="vertical" size="large" className="w-full">
                {/* Inventory Card */}
                <Card className="bg-blue-50 border-blue-100 shadow-sm">
                    <Statistic
                        title={<span className="text-blue-600 font-medium"><ExperimentOutlined /> Current Inventory</span>}
                        value={inventory}
                        precision={1}
                        suffix="Liters"
                        valueStyle={{ color: '#1677ff', fontWeight: 'bold' }}
                    />
                    <div className="mt-2 text-xs text-blue-500">
                        {((inventory / (settings?.maxCapacity || 2000)) * 100).toFixed(0)}% of max capacity
                    </div>
                </Card>

                {/* Recent Stocks Table */}
                <Card title="Recent Collections" className="shadow-sm" bodyStyle={{ padding: 0 }}>
                    <Table
                        dataSource={stocks.slice(0, 5)}
                        columns={columns}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        loading={isLoading}
                    />
                </Card>
             </Space>
        </Col>
      </Row>
    </div>
  );
};

export default Stock;
