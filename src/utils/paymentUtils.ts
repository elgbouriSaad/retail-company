import { PaymentInstallment } from '../types';

/**
 * Generate payment schedule for an order
 * 
 * Logic:
 * - totalAmount is the TOTAL contract value (e.g., 5000 DH)
 * - advanceMoney is the FIRST payment (e.g., 1000 DH), already included in totalAmount
 * - Remaining = totalAmount - advanceMoney (e.g., 5000 - 1000 = 4000 DH)
 * - Divide remaining by (paymentMonths - 1) for other months
 */
export const generatePaymentSchedule = (
  startDate: string | undefined,
  totalAmount: number,
  downPayment: number, // Not used for Ponge, kept for compatibility
  advanceMoney: number,
  paymentMonths: number
): PaymentInstallment[] => {
  const schedule: PaymentInstallment[] = [];
  
  // If no total amount or no payment months, return empty schedule
  if (totalAmount <= 0 || paymentMonths <= 0) {
    return schedule;
  }
  
  // Calculate remaining amount after advance (advance is PART of total, not additional)
  const remainingAfterAdvance = totalAmount - advanceMoney;
  
  // Calculate monthly installment for remaining months
  const monthlyInstallment = paymentMonths > 1 
    ? remainingAfterAdvance / (paymentMonths - 1)
    : remainingAfterAdvance;
  
  // Determine base date (use startDate or today)
  const baseDate = startDate ? new Date(startDate) : new Date();
  
  // First installment: Advance money (due at start date) if specified
  // The advance is paid upfront when creating the order, so mark as 'paid'
  if (advanceMoney > 0 && paymentMonths >= 1) {
    schedule.push({
      id: `installment-1`,
      dueDate: baseDate.toISOString().split('T')[0],
      amount: advanceMoney,
      status: 'paid', // Marked as paid since it's paid when creating the order
      paidDate: baseDate.toISOString().split('T')[0],
      paidAmount: advanceMoney,
      method: 'cash' // Default method for advance
    });
  }
  
  // Subsequent monthly installments
  // Start from month 1 (since month 0 is the advance)
  const remainingMonths = advanceMoney > 0 ? paymentMonths - 1 : paymentMonths;
  
  for (let i = 0; i < remainingMonths; i++) {
    const dueDate = new Date(baseDate);
    // Add (i+1) months if we had an advance, otherwise just i months
    const monthsToAdd = advanceMoney > 0 ? i + 1 : i;
    dueDate.setMonth(dueDate.getMonth() + monthsToAdd);
    
    schedule.push({
      id: `installment-${schedule.length + 1}`,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: monthlyInstallment,
      status: 'pending'
    });
  }
  
  return schedule;
};

/**
 * Update installment statuses based on current date
 */
export const updateInstallmentStatuses = (
  schedule: PaymentInstallment[]
): PaymentInstallment[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return schedule.map(installment => {
    if (installment.status === 'paid') {
      return installment;
    }
    
    const dueDate = new Date(installment.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) {
      return { ...installment, status: 'overdue' as const };
    }
    
    return installment;
  });
};

/**
 * Calculate total paid from payment schedule
 */
export const calculateTotalPaid = (schedule: PaymentInstallment[]): number => {
  return schedule
    .filter(inst => inst.status === 'paid')
    .reduce((sum, inst) => sum + (inst.paidAmount || inst.amount), 0);
};

/**
 * Calculate total remaining from payment schedule
 */
export const calculateTotalRemaining = (schedule: PaymentInstallment[]): number => {
  return schedule
    .filter(inst => inst.status !== 'paid')
    .reduce((sum, inst) => sum + inst.amount, 0);
};

/**
 * Get next payment due date
 */
export const getNextPaymentDue = (schedule: PaymentInstallment[]): PaymentInstallment | null => {
  const unpaid = schedule.filter(inst => inst.status !== 'paid');
  if (unpaid.length === 0) return null;
  
  return unpaid.reduce((earliest, current) => {
    return new Date(current.dueDate) < new Date(earliest.dueDate) ? current : earliest;
  });
};

/**
 * Get overdue installments
 */
export const getOverdueInstallments = (schedule: PaymentInstallment[]): PaymentInstallment[] => {
  return schedule.filter(inst => inst.status === 'overdue');
};

/**
 * Calculate days overdue
 */
export const calculateDaysOverdue = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
};

/**
 * Record a payment against an installment
 */
export const recordPayment = (
  schedule: PaymentInstallment[],
  installmentId: string,
  amount: number,
  method: PaymentInstallment['method'],
  date: string,
  notes?: string
): PaymentInstallment[] => {
  return schedule.map(inst => {
    if (inst.id === installmentId) {
      return {
        ...inst,
        status: 'paid' as const,
        paidDate: date,
        paidAmount: amount,
        method,
        notes
      };
    }
    return inst;
  });
};

