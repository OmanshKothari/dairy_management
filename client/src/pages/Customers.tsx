import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    Button, 
    Card, 
    Modal, 
    Form, 
    Input, 
    InputNumber, 
    Select, 
    Space, 
    Typography, 
    List, 
    Popconfirm,
    Badge,
    Avatar,
    message,
    Empty,
    Row,
    Col
} from 'antd';
import { 
    PlusOutlined, 
    DeleteOutlined, 
    EditOutlined, 
    UserOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    DollarOutlined
} from '@ant-design/icons';
import { useSettings } from '../contexts/SettingsContext';
import { customerApi } from '../services/api';
import { Customer, CustomerFormData, CustomerCategory } from '../types';
import { stringToColor } from '../utils/helpers';

const { Title, Text } = Typography;
const { Option } = Select;

const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data.filter((c) => c.isActive));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      message.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      handleOpenAdd();
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    form.resetFields();
    // Default values
    form.setFieldsValue({
        morningQuota: 1,
        eveningQuota: 0,
        pricePerLiter: settings?.defaultPricePerLiter || 2,
        category: CustomerCategory.REGULAR
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    form.setFieldsValue({
        name: customer.name,
        address: customer.address,
        phone: customer.phone,
        category: customer.category,
        morningQuota: customer.morningQuota,
        eveningQuota: customer.eveningQuota,
        pricePerLiter: customer.pricePerLiter
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCustomer(null);
    form.resetFields();
  };

  const handleSubmit = async (values: CustomerFormData) => {
    try {
      setIsSaving(true);
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, values);
        message.success('Customer updated successfully');
      } else {
        await customerApi.create(values);
        message.success('Customer added successfully');
      }
      handleCloseModal();
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      message.error('Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customerApi.delete(id);
      message.success('Customer deleted');
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      message.error('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Title level={2} style={{ margin: 0 }}>Customer Management</Title>
          <Text type="secondary">Manage profiles and daily quotas</Text>
        </div>
        <Button 
            type="primary" 
            onClick={handleOpenAdd} 
            icon={<PlusOutlined />}
            size="large"
        >
          Add Customer
        </Button>
      </div>

      <List
        grid={{ gutter: 16, xs: 1, sm: 2, lg: 3, xl: 4 }}
        dataSource={customers}
        loading={isLoading}
        locale={{ emptyText: <Empty description="No customers found" /> }}
        renderItem={(customer) => (
          <List.Item>
            <Card
                className="hover:shadow-md transition-shadow"
                actions={[
                    <Button type="text" icon={<EditOutlined />} onClick={() => handleOpenEdit(customer)}>Edit</Button>,
                    <Popconfirm
                        title="Delete customer?"
                        description="This action cannot be undone."
                        onConfirm={() => handleDelete(customer.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                         <Button type="text" danger icon={<DeleteOutlined />}>Delete</Button>
                    </Popconfirm>
                ]}
            >
                <Card.Meta 
                    avatar={
                        <Avatar 
                            size={48} 
                            style={{ backgroundColor: stringToColor(customer.name) }}
                        >
                            {customer.name.charAt(0).toUpperCase()}
                        </Avatar>
                    }
                    title={
                        <Space className="w-full justify-between">
                            <Text strong ellipsis style={{ maxWidth: 120 }}>{customer.name}</Text>
                        </Space>
                    }
                    description={
                        <div className="space-y-1">
                            <Space size={4}>
                                <EnvironmentOutlined />
                                <Text type="secondary" style={{ fontSize: 12 }}>{customer.address}</Text>
                            </Space>
                            {customer.phone && (
                                <div style={{ fontSize: 12 }}>
                                    <PhoneOutlined /> {customer.phone}
                                </div>
                            )}
                        </div>
                    }
                />
                
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <Text type="secondary" style={{ fontSize: 11 }}>MORNING</Text>
                        <div className="font-bold text-lg">{customer.morningQuota} L</div>
                    </div>
                    <div className="text-center">
                        <Text type="secondary" style={{ fontSize: 11 }}>EVENING</Text>
                        <div className="font-bold text-lg">{customer.eveningQuota} L</div>
                    </div>
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between items-center bg-gray-50 -mx-6 -mb-6 p-3 px-6">
                    <Space>
                        <DollarOutlined className="text-blue-500" />
                        <Text>{settings?.currencySymbol}{customer.pricePerLiter}/L</Text>
                    </Space>
                    <Badge 
                        status={customer.category === CustomerCategory.REGULAR ? 'success' : 'warning'} 
                        text={customer.category} 
                    />
                </div>
            </Card>
          </List.Item>
        )}
      />

      <Modal
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
        open={isModalOpen}
        onCancel={handleCloseModal}
        footer={null}
        destroyOnClose
      >
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                name="name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter name' }]}
            >
                <Input prefix={<UserOutlined />} placeholder="e.g. Mrs. Sharma" />
            </Form.Item>

            <Form.Item
                name="address"
                label="Address / Route"
                rules={[{ required: true, message: 'Please enter address' }]}
            >
                <Input prefix={<EnvironmentOutlined />} placeholder="e.g. 12 Green St" />
            </Form.Item>

            <Form.Item
                name="phone"
                label="Phone Number"
            >
                <Input prefix={<PhoneOutlined />} placeholder="Optional" />
            </Form.Item>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="category"
                        label="Category"
                        rules={[{ required: true }]}
                    >
                        <Select>
                            <Option value={CustomerCategory.REGULAR}>Regular</Option>
                            <Option value={CustomerCategory.VARIABLE}>Variable</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="pricePerLiter"
                        label={`Price (${settings?.currencySymbol || ''}/L)`}
                        rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                        <InputNumber style={{ width: '100%' }} step={0.5} />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item
                        name="morningQuota"
                        label="Morning Quota (L)"
                        rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                        <InputNumber style={{ width: '100%' }} step={0.5} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item
                        name="eveningQuota"
                        label="Evening Quota (L)"
                        rules={[{ required: true, type: 'number', min: 0 }]}
                    >
                        <InputNumber style={{ width: '100%' }} step={0.5} />
                    </Form.Item>
                </Col>
            </Row>
            
            <div className="flex justify-end gap-2 pt-4">
                <Button onClick={handleCloseModal}>Cancel</Button>
                <Button type="primary" htmlType="submit" loading={isSaving}>
                    {editingCustomer ? 'Update Customer' : 'Add Customer'}
                </Button>
            </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;
