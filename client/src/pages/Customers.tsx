import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { Card, Button, Modal, LoadingSpinner, EmptyState } from '../components/ui';
import { useSettings } from '../contexts/SettingsContext';
import { customerApi } from '../services/api';
import { Customer, CustomerFormData, CustomerCategory } from '../types';
import { getInitials, stringToColor } from '../utils/helpers';
import toast from 'react-hot-toast';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading,
}) => {
  const { settings } = useSettings();
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    phone: initialData?.phone || '',
    category: initialData?.category || CustomerCategory.REGULAR,
    morningQuota: initialData?.morningQuota || 1,
    eveningQuota: initialData?.eveningQuota || 0,
    pricePerLiter: initialData?.pricePerLiter || settings?.defaultPricePerLiter || 2,
  });

  const handleChange = (field: keyof CustomerFormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Full Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="e.g. Mrs. Sharma"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Address / Route
        </label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="e.g. 12 Green St, North Route"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Morning Quota (L)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.morningQuota}
            onChange={(e) => handleChange('morningQuota', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Evening Quota (L)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.eveningQuota}
            onChange={(e) => handleChange('eveningQuota', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Price per Liter
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
            {settings?.currencySymbol || '$'}
          </span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={formData.pricePerLiter}
            onChange={(e) => handleChange('pricePerLiter', parseFloat(e.target.value) || 0)}
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-8 pr-4 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isLoading}>
          Save Customer
        </Button>
      </div>
    </form>
  );
};

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  currencySymbol: string;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  currencySymbol,
}) => {
  const initials = getInitials(customer.name);
  const bgColor = stringToColor(customer.name);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <Card className="relative h-full transition-shadow hover:shadow-md">
        <button
          onClick={() => onDelete(customer.id)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
          title="Delete customer"
        >
          <Trash2 className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: bgColor }}
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-gray-900">{customer.name}</h3>
            <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="h-3.5 w-3.5" />
              <span className="truncate">{customer.address || 'No address'}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Morning</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">{customer.morningQuota} L</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Evening</p>
            <p className="mt-0.5 text-lg font-bold text-gray-900">{customer.eveningQuota} L</p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <span className="text-sm text-gray-500">
            Rate: {currencySymbol}
            {customer.pricePerLiter.toFixed(2)}/L
          </span>
          <button
            onClick={() => onEdit(customer)}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      </Card>
    </motion.div>
  );
};

const Customers: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { settings } = useSettings();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get('action') === 'add') {
      setShowModal(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const fetchCustomers = async () => {
    try {
      setIsLoading(true);
      const data = await customerApi.getAll();
      setCustomers(data.filter((c) => c.isActive));
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setShowModal(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
  };

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setIsSaving(true);
      if (editingCustomer) {
        await customerApi.update(editingCustomer.id, data);
        toast.success('Customer updated successfully');
      } else {
        await customerApi.create(data);
        toast.success('Customer added successfully');
      }
      handleCloseModal();
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to save customer:', error);
      toast.error('Failed to save customer');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await customerApi.delete(id);
      toast.success('Customer deleted');
      setDeleteConfirm(null);
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('Failed to delete customer');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="mt-1 text-gray-500">Manage profiles and daily quotas</p>
        </div>
        <Button onClick={handleOpenAdd} leftIcon={<Plus className="h-4 w-4" />}>
          Add Customer
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-8 w-8" />}
          title="No customers yet"
          description="Add your first customer to get started"
          action={
            <Button onClick={handleOpenAdd} leftIcon={<Plus className="h-4 w-4" />}>
              Add Customer
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {customers.map((customer) => (
              <CustomerCard
                key={customer.id}
                customer={customer}
                onEdit={handleOpenEdit}
                onDelete={(id) => setDeleteConfirm(id)}
                currencySymbol={settings?.currencySymbol || '$'}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
      >
        <CustomerForm
          initialData={editingCustomer}
          onSubmit={handleSubmit}
          onCancel={handleCloseModal}
          isLoading={isSaving}
        />
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Customer"
        size="sm"
      >
        <p className="text-gray-600">
          Are you sure you want to delete this customer? This action cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => deleteConfirm && handleDelete(deleteConfirm)}>
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Customers;
