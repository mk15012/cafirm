'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import Link from 'next/link';
import { format } from 'date-fns';
import AppLayout from '@/components/layout/AppLayout';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { 
  ArrowLeft, 
  Building2, 
  Users, 
  Calendar, 
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  CreditCard,
  Mail
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Invoice {
  id: number;
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: string;
  status: string;
  paidDate?: string;
  paymentReference?: string;
  createdAt: string;
  firm: {
    id: number;
    name: string;
    client: {
      id: number;
      name: string;
      email?: string;
      phone?: string;
    };
  };
  createdBy: {
    id: number;
    name: string;
    email: string;
  };
}

export default function InvoiceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, user, isLoading, initializeAuth } = useAuthStore();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/auth/login');
        return;
      }
      loadInvoice();
    }
  }, [params.id, isAuthenticated, isLoading, router]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/invoices/${params.id}`);
      setInvoice(response.data);
    } catch (error: any) {
      console.error('Failed to load invoice:', error);
      setError(error.response?.data?.error || 'Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      setMarkingPaid(true);
      await api.put(`/invoices/${params.id}/pay`, {});
      setShowMarkPaidModal(false);
      loadInvoice();
      toast.success('Invoice marked as paid!');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to mark as paid');
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleSendInvoice = () => {
    if (!invoice) return;
    
    const clientEmail = invoice.firm.client.email;
    if (!clientEmail) {
      toast.error('Client email not found. Please add email to the client profile first.');
      return;
    }

    // Format currency
    const formatCurrency = (amount: number) => '₹' + amount.toLocaleString('en-IN');
    
    // Format date
    const formatDueDate = (date: string) => format(new Date(date), 'MMMM dd, yyyy');

    // Create email subject
    const subject = `Invoice #${invoice.invoiceNumber} - Amount Due: ${formatCurrency(invoice.totalAmount)}`;
    
    // Create email body
    const body = `Dear ${invoice.firm.client.name},

Please find below the invoice details for services rendered to ${invoice.firm.name}.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
INVOICE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Invoice Number: #${invoice.invoiceNumber}
Firm Name: ${invoice.firm.name}
Invoice Date: ${format(new Date(invoice.createdAt), 'MMMM dd, yyyy')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
AMOUNT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Service Amount: ${formatCurrency(invoice.amount)}
Tax (GST): ${formatCurrency(invoice.taxAmount)}
─────────────────────────────────────────
TOTAL AMOUNT DUE: ${formatCurrency(invoice.totalAmount)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PAYMENT DUE DATE: ${formatDueDate(invoice.dueDate)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Please make the payment by the due date mentioned above.

If you have any questions regarding this invoice, please feel free to contact us.

Thank you for your business!

Best regards,
${invoice.createdBy.name}
${invoice.createdBy.email}`;

    // Create mailto link and open it
    const mailtoLink = `mailto:${clientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UNPAID: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      PAID: 'bg-green-100 text-green-800 border-green-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
      PARTIAL: 'bg-blue-100 text-blue-800 border-blue-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <XCircle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status !== 'PAID';
  };

  if (isLoading || loading) {
    return (
      <AppLayout title="Invoice Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold">Loading invoice details...</h1>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (error || !invoice) {
    return (
      <AppLayout title="Invoice Details">
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Invoice</h1>
            <p className="text-gray-600 mb-4">{error || 'Invoice not found'}</p>
            <button
              onClick={loadInvoice}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const overdue = isOverdue(invoice.dueDate, invoice.status);

  return (
    <AppLayout title={`Invoice: ${invoice.invoiceNumber}`}>
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Invoices
        </button>

        {/* Invoice Header Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Created on {format(new Date(invoice.createdAt), 'MMM dd, yyyy')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusIcon(invoice.status)}
              <span className={`px-3 py-1.5 text-sm font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                {invoice.status}
              </span>
              <button
                onClick={handleSendInvoice}
                disabled={!invoice.firm.client.email}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50"
                title={!invoice.firm.client.email ? 'Client email not available' : 'Send invoice via email'}
              >
                <Mail className="w-4 h-4" />
                Send Invoice
              </button>
              {invoice.status !== 'PAID' && (
                <button
                  onClick={() => setShowMarkPaidModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid
                </button>
              )}
            </div>
          </div>

          {overdue && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <span className="font-semibold">Overdue</span> - Due date was {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
              </p>
            </div>
          )}
        </div>

        {/* Invoice Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Client & Firm Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">Bill To</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Firm</p>
                  <Link
                    href={`/firms/${invoice.firm.id}`}
                    className="text-primary-600 hover:text-primary-700 hover:underline font-medium text-sm"
                  >
                    {invoice.firm.name}
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Client</p>
                  <Link
                    href={`/clients/${invoice.firm.client.id}`}
                    className="text-primary-600 hover:text-primary-700 hover:underline font-medium text-sm"
                  >
                    {invoice.firm.client.name}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="text-base font-bold text-gray-900 mb-3">Invoice Details</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Due Date</p>
                  <p className={`font-medium text-sm ${overdue ? 'text-red-600' : 'text-gray-900'}`}>
                    {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </div>
              {invoice.paidDate && (
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-xs text-gray-500">Paid Date</p>
                    <p className="font-medium text-sm text-gray-900">
                      {format(new Date(invoice.paidDate), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              )}
              {invoice.paymentReference && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Payment Reference</p>
                    <p className="font-medium text-sm text-gray-900">{invoice.paymentReference}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">Created By</p>
                  <p className="font-medium text-sm text-gray-900">{invoice.createdBy.name}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Amount Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Amount Breakdown</h2>
          <div className="space-y-2">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-gray-600">Service Amount</span>
              <span className="font-semibold text-gray-900">₹{invoice.amount.toLocaleString('en-IN')}</span>
            </div>
            {invoice.taxAmount > 0 && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Tax (GST)</span>
                <span className="font-semibold text-gray-900">₹{invoice.taxAmount.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-3 bg-primary-50 rounded-lg px-3 mt-2">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="text-xl font-bold text-primary-600">
                ₹{invoice.totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        {invoice.status === 'PAID' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Payment Received</p>
                <p className="text-sm text-green-700">
                  This invoice was marked as paid on {format(new Date(invoice.paidDate!), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.status === 'UNPAID' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-900">Payment Pending</p>
                <p className="text-sm text-yellow-700">
                  This invoice is awaiting payment. Due date: {format(new Date(invoice.dueDate), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>
        )}

        {invoice.status === 'OVERDUE' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Payment Overdue</p>
                <p className="text-sm text-red-700">
                  This invoice is past its due date. Please follow up with the client for payment.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mark as Paid Confirmation Modal */}
        <ConfirmModal
          isOpen={showMarkPaidModal}
          onClose={() => setShowMarkPaidModal(false)}
          onConfirm={handleMarkPaid}
          title="Mark Invoice as Paid"
          message={`Are you sure you want to mark invoice #${invoice.invoiceNumber} as paid? This will update the payment status.`}
          confirmText="Yes, Mark as Paid"
          cancelText="Cancel"
          variant="success"
          loading={markingPaid}
        />
      </div>
    </AppLayout>
  );
}

