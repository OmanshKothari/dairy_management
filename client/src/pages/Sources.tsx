/**
 * Sources Management Page
 * 
 * Manage dynamic stock sources (Farms, Markets, etc.)
 */

import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, Popconfirm, message, Card, Space } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

interface Source {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
}

const Sources: React.FC = () => {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSources = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sources');
      if (response.data.success) {
        setSources(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sources', error);
      message.error('Failed to load sources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSources();
  }, []);

  const handleAdd = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: Source) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`/api/sources/${id}`);
      message.success('Source deleted successfully');
      fetchSources();
    } catch (error) {
      message.error('Failed to delete source');
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingId) {
        // Update
        await axios.put(`/api/sources/${editingId}`, values);
        message.success('Source updated successfully');
      } else {
        // Create
        await axios.post('/api/sources', values);
        message.success('Source created successfully');
      }
      setIsModalVisible(false);
      fetchSources();
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={type === 'farm' ? 'green' : type === 'market' ? 'blue' : 'default'}>
          {type.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'ACTIVE' : 'INACTIVE'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Source) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm title="Are you sure?" onConfirm={() => handleDelete(record.id)}>
             <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Source Management</h1>
        <Button id="add-source-btn" type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Add Source
        </Button>
      </div>

      <Card>
        <Table columns={columns} dataSource={sources} rowKey="id" loading={loading} />
      </Card>

      <Modal
        title={editingId ? "Edit Source" : "Add Source"}
        open={isModalVisible}
        onOk={handleOk}
        onCancel={() => setIsModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Source Name" rules={[{ required: true, message: 'Please enter source name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Please select type' }]}>
            <Select>
              <Option value="farm">Farm</Option>
              <Option value="market">Market</Option>
              <Option value="other">Other</Option>
            </Select>
          </Form.Item>
          {editingId && (
              <Form.Item name="isActive" label="Status" valuePropName="checked">
                   <Input type="checkbox" /> 
              </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default Sources;
