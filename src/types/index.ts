export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'member';
  balance: number;
  totalSpent: number;
  totalOrders: number;
  orderCount?: number;
  xp: number;
  fcmToken?: string;
  createdAt?: any;
  lastSeen?: any;
  claimedReferral?: boolean;
  referredBy?: string;
}

export type DepositMethod = 'DANA' | 'QRIS';
export type DepositStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Deposit {
  id: string;
  uid: string;
  email: string;
  amount: number;
  senderName: string;
  method: DepositMethod;
  status: DepositStatus;
  createdAt: any;
  approvedAt?: any;
  approvedBy?: string;
  notes?: string;
  rejectionReason?: string;
}

export type DepositRecord = Deposit;

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export interface Order {
  id: string;
  uid: string;
  userEmail?: string;
  productId: string;
  productName: string;
  amount: number; // Unit price
  quantity: number;
  total: number;
  status: OrderStatus;
  result?: any;
  errorMessage?: string;
  createdAt: any;
  completedAt?: any;
}

export type OrderRecord = Order;

export interface Mutation {
  id: string;
  uid: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: any;
}

export type MutationRecord = Mutation;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  active: boolean;
  apiEndpoint?: string;
  category?: string;
  badge?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type ProductItem = Product;

export interface SystemSettings {
  siteName: string;
  depositOpen: boolean;
  minDeposit: number;
  maxDeposit: number;
  danaNumber: string;
  danaName: string;
  qrisUrl: string;
  whatsappChannel: string;
  promoUrl: string;
  apkUrl: string;
  apkName: string;
  apkVersion: string;
  amApiEndpoint: string;
  hdApiEndpoint: string;
  amApi?: string;
  hdApi?: string;
}

export interface ToastItem {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  description?: string;
  duration?: number;
}

export type ToastMessage = ToastItem;

export interface BroadcastNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'promo' | 'alert' | 'success';
  createdAt: any;
  createdBy?: string;
}

export type ActiveTab =
  | 'dashboard'
  | 'order'
  | 'orders'
  | 'deposit'
  | 'katalog'
  | 'mutasi'
  | 'referral'
  | 'profile'
  | 'admin';
