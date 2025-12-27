import React, { useState } from 'react';
import { Drawer, FloatButton, Tabs, Form, Input, Button, ColorPicker, Segmented, Slider, Space, Typography, InputNumber, Divider } from 'antd';
import { SettingOutlined, BgColorsOutlined, ShopOutlined, CheckOutlined } from '@ant-design/icons';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { Settings } from '../types';

const { Title } = Typography;

const SettingsDrawer: React.FC = () => {
    const [open, setOpen] = useState(false);
    const { 
        primaryColor, setPrimaryColor, 
        isDarkMode, toggleDarkMode, 
        borderRadius, setBorderRadius 
    } = useTheme();
    const { settings, updateSettings, isLoading } = useSettings();
    const [form] = Form.useForm();

    const showDrawer = () => {
        setOpen(true);
        form.setFieldsValue(settings);
    };

    const onClose = () => {
        setOpen(false);
    };

    const handleBusinessSave = async (values: Partial<Settings>) => {
        await updateSettings(values);
    };
    
    // Preset colors for the theme picker
    const brandColors = [
        '#1a73e8', // Google Blue (Default)
        '#722ed1', // Purple
        '#faad14', // Gold
        '#f5222d', // Red
        '#52c41a', // Green
        '#ea0e83', // Magenta
    ];

    return (
        <>
            <FloatButton 
                icon={<SettingOutlined />} 
                type="primary" 
                style={{ right: 24, bottom: 24 }} 
                onClick={showDrawer}
                tooltip="App Settings"
            />
            
            <Drawer
                title="Settings"
                placement="right"
                onClose={onClose}
                open={open}
                width={400}
            >
                <Tabs defaultActiveKey="1" items={[
                    {
                        key: '1',
                        label: <span><BgColorsOutlined /> Appearance</span>,
                        children: (
                            <div className="flex flex-col gap-6">
                                <div>
                                    <Title level={5}>Theme Mode</Title>
                                    <Segmented
                                        value={isDarkMode ? 'Dark' : 'Light'}
                                        onChange={() => toggleDarkMode()}
                                        options={[
                                            { label: 'Light', value: 'Light', icon: <div className="w-4 h-4 rounded-full bg-gray-200 border border-gray-300" /> },
                                            { label: 'Dark', value: 'Dark', icon: <div className="w-4 h-4 rounded-full bg-gray-800 border border-gray-600" /> },
                                        ]}
                                        block
                                    />
                                </div>
                                <Divider style={{ margin: '0' }} />
                                <div>
                                    <Title level={5}>Brand Color</Title>
                                    <Space wrap size={[12, 12]}>
                                        {brandColors.map(color => (
                                            <div 
                                                key={color}
                                                style={{ 
                                                    backgroundColor: color, 
                                                    width: 36, 
                                                    height: 36, 
                                                    borderRadius: '50%', 
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    border: primaryColor === color ? `3px solid ${isDarkMode ? '#fff' : '#000'}` : '2px solid transparent',
                                                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                }}
                                                onClick={() => setPrimaryColor(color)}
                                            >
                                                {primaryColor === color && <CheckOutlined style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textShadow: '0 1px 2px rgba(0,0,0,0.3)' }} />}
                                            </div>
                                        ))}
                                        <div className="flex items-center ml-2">
                                            <ColorPicker 
                                                value={primaryColor} 
                                                onChange={(c) => setPrimaryColor(c.toHexString())} 
                                                showText
                                            />
                                        </div>
                                    </Space>
                                </div>
                                <Divider style={{ margin: '0' }} />
                                <div>
                                    <Title level={5}>Roundness: {borderRadius}px</Title>
                                    <Slider 
                                        min={0} 
                                        max={24} 
                                        value={borderRadius} 
                                        onChange={setBorderRadius} 
                                        marks={{ 0: 'Square', 8: 'Default', 16: 'High', 24: 'Full' }}
                                    />
                                </div>
                            </div>
                        )
                    },
                    {
                        key: '2',
                        label: <span><ShopOutlined /> Business Info</span>,
                        children: (
                            <Form
                                form={form}
                                layout="vertical"
                                onFinish={handleBusinessSave}
                            >
                                <Form.Item
                                    name="businessName"
                                    label="Business Name"
                                    rules={[{ required: true, message: 'Please enter business name' }]}
                                >
                                    <Input placeholder="Market Dairy Name" />
                                </Form.Item>
                                
                                <Form.Item
                                    name="businessAddress"
                                    label="Address"
                                >
                                    <Input.TextArea rows={2} placeholder="Shop Address" />
                                </Form.Item>
                                
                                <Form.Item
                                    name="businessPhone"
                                    label="Phone Number"
                                >
                                    <Input placeholder="+91 98765 43210" />
                                </Form.Item>
                                
                                <Row gutter={16}>
                                    <Col span={12}>
                                        <Form.Item
                                            name="currencySymbol"
                                            label="Currency Symbol"
                                            rules={[{ required: true }]}
                                        >
                                            <Input style={{ textAlign: 'center' }} />
                                        </Form.Item>
                                    </Col>
                                    <Col span={12}>
                                        <Form.Item
                                            name="defaultPricePerLiter"
                                            label="Default Price"
                                            rules={[{ required: true }]}
                                        >
                                            <InputNumber 
                                                style={{ width: '100%' }} 
                                                formatter={value => `${value}`}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>

                                <Form.Item>
                                    <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                                        Save Information
                                    </Button>
                                </Form.Item>
                            </Form>
                        )
                    }
                ]} />
            </Drawer>
        </>
    );
};

// Import helper for Row/Col used inside form tabs but outside component
import { Row, Col } from 'antd';

export default SettingsDrawer;
