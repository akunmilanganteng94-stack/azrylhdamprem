import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  runTransaction,
  type Unsubscribe
} from 'firebase/firestore';
import { db } from '../firebase/config';
import type { 
  UserProfile, 
  DepositRecord, 
  OrderRecord, 
  MutationRecord, 
  ProductItem, 
  SystemSettings 
} from '../types';

export const OWNER_EMAIL = 'apriliansyahazril10@gmail.com';

export const DEFAULT_SETTINGS: SystemSettings = {
  siteName: 'AZRYLPREM',
  depositOpen: true,
  minDeposit: 1000,
  maxDeposit: 1000000,
  danaNumber: '085786683784',
  danaName: 'JEJE',
  qrisUrl: 'https://api.zyvor.my.id/files/16e4dbd0fc28a8031b247897df219df5.jpeg',
  whatsappChannel: 'https://whatsapp.com/channel/0029VbCwLl7J3jv1QSig1V0C',
  promoUrl: 'https://www.azryl.my.id/',
  apkUrl: '',
  apkName: 'AZRYLPREM Mobile',
  apkVersion: 'v1.0.0',
  amApi: 'https://api.zyvor.my.id/api/am/bulkv3',
  hdApi: 'https://api.zyvor.my.id/api/imagehd/upscalev2',
  amApiEndpoint: 'https://api.zyvor.my.id/api/am/bulkv3',
  hdApiEndpoint: 'https://api.zyvor.my.id/api/imagehd/upscalev2',
};

export const INITIAL_PRODUCTS: ProductItem[] = [
  {
    id: 'am_prem',
    name: 'Alight motion premium',
    description: 'Akun Alight Motion Premium Terverifikasi otomatis. Proses instan via server.',
    price: 500,
    active: true,
    apiEndpoint: 'https://api.zyvor.my.id/api/am/bulkv3',
    badge: 'HOT'
  },
  {
    id: 'hd_foto',
    name: 'HD FOTO UPSCALE',
    description: 'Tingkatkan kualitas & ketajaman foto jadi super jernih dengan AI Resolution Upscale 2x.',
    price: 50,
    active: true,
    apiEndpoint: 'https://api.zyvor.my.id/api/imagehd/upscalev2',
    badge: 'AI TOOLS'
  }
];

// USER PROFILE MANAGEMENT
export async function syncUserProfile(user: { uid: string; email: string | null; displayName: string | null }): Promise<UserProfile> {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  const isOwner = (user.email || '').toLowerCase() === OWNER_EMAIL.toLowerCase();

  if (!snap.exists()) {
    const newProfile: UserProfile = {
      uid: user.uid,
      name: user.displayName || user.email?.split('@')[0] || 'Member AZRYL',
      email: user.email || '',
      role: isOwner ? 'admin' : 'member',
      balance: 0,
      totalSpent: 0,
      totalOrders: 0,
      orderCount: 0,
      xp: 25,
      createdAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    };
    await setDoc(userRef, newProfile);
    return newProfile;
  } else {
    const existing = snap.data() as UserProfile;
    // Keep owner as admin if not set
    const shouldBeAdmin = isOwner || existing.role === 'admin';
    const updates: Partial<UserProfile> = {
      lastSeen: serverTimestamp(),
      ...(user.displayName && !existing.name ? { name: user.displayName } : {}),
      ...(shouldBeAdmin && existing.role !== 'admin' ? { role: 'admin' } : {})
    };
    await updateDoc(userRef, updates);
    return { ...existing, ...updates, role: shouldBeAdmin ? 'admin' : existing.role };
  }
}

export function listenUserProfile(uid: string, callback: (profile: UserProfile | null) => void): Unsubscribe {
  const userRef = doc(db, 'users', uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      callback({ uid: snap.id, ...(snap.data() as any) });
    } else {
      callback(null);
    }
  }, (err) => {
    console.error('Error listening user profile:', err);
  });
}

// SYSTEM SETTINGS
export function listenSystemSettings(callback: (settings: SystemSettings) => void): Unsubscribe {
  const settingsRef = doc(db, 'settings', 'system');
  return onSnapshot(settingsRef, (snap) => {
    if (snap.exists()) {
      callback({ ...DEFAULT_SETTINGS, ...snap.data() } as SystemSettings);
    } else {
      // Seed default settings
      setDoc(settingsRef, DEFAULT_SETTINGS).catch(console.error);
      callback(DEFAULT_SETTINGS);
    }
  }, (err) => {
    console.warn('Using default settings due to Firestore permission/network:', err);
    callback(DEFAULT_SETTINGS);
  });
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
  const settingsRef = doc(db, 'settings', 'system');
  await setDoc(settingsRef, settings, { merge: true });
}

// PRODUCTS
export function listenProducts(callback: (products: ProductItem[]) => void): Unsubscribe {
  const productsCol = collection(db, 'products');
  return onSnapshot(productsCol, (snap) => {
    if (snap.empty) {
      // Seed initial products
      INITIAL_PRODUCTS.forEach(p => {
        setDoc(doc(db, 'products', p.id), { ...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }).catch(console.error);
      });
      callback(INITIAL_PRODUCTS);
    } else {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ProductItem));
      callback(list);
    }
  }, (err) => {
    console.warn('Error listening products, fallback to initial:', err);
    callback(INITIAL_PRODUCTS);
  });
}

export async function updateProduct(product: ProductItem): Promise<void> {
  const ref = doc(db, 'products', product.id);
  await setDoc(ref, {
    ...product,
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export async function createProduct(product: Omit<ProductItem, 'id'>): Promise<string> {
  const ref = collection(db, 'products');
  const docRef = await addDoc(ref, {
    ...product,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

// DEPOSITS
export async function createDeposit(data: {
  uid: string;
  email: string;
  amount: number;
  senderName: string;
  method: 'DANA' | 'QRIS';
}): Promise<string> {
  const col = collection(db, 'deposits');
  const docRef = await addDoc(col, {
    ...data,
    status: 'PENDING',
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

function getMillis(time: any): number {
  if (!time) return 0;
  if (typeof time?.toMillis === 'function') return time.toMillis();
  if (time?.seconds) return time.seconds * 1000;
  if (time instanceof Date) return time.getTime();
  const d = new Date(time);
  return isNaN(d.getTime()) ? 0 : d.getTime();
}

export function listenUserDeposits(uid: string, callback: (deposits: DepositRecord[]) => void): Unsubscribe {
  // Query by uid only to avoid requiring composite indexes in Firestore
  const q = query(
    collection(db, 'deposits'),
    where('uid', '==', uid),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRecord));
    list.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    callback(list);
  }, (err) => {
    console.warn('Notice listening user deposits:', err?.message || err);
  });
}

export function listenAllDeposits(callback: (deposits: DepositRecord[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'deposits'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as DepositRecord));
    callback(list);
  }, (err) => {
    console.error('Error listening all deposits:', err);
  });
}

// APPROVE DEPOSIT WITH TRANSACTION
export async function approveDeposit(depositId: string, adminUid: string): Promise<boolean> {
  return await runTransaction(db, async (transaction) => {
    const depositRef = doc(db, 'deposits', depositId);
    const depositSnap = await transaction.get(depositRef);

    if (!depositSnap.exists()) {
      throw new Error('Deposit tidak ditemukan.');
    }

    const deposit = depositSnap.data() as DepositRecord;
    if (deposit.status !== 'PENDING') {
      throw new Error(`Deposit sudah berstatus ${deposit.status}`);
    }

    const userRef = doc(db, 'users', deposit.uid);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('User pembuat deposit tidak ditemukan.');
    }

    const userData = userSnap.data() as UserProfile;
    const balanceBefore = userData.balance || 0;
    const balanceAfter = balanceBefore + deposit.amount;

    // 1. Update deposit status
    transaction.update(depositRef, {
      status: 'APPROVED',
      approvedAt: serverTimestamp(),
      approvedBy: adminUid
    });

    // 2. Increment user balance
    transaction.update(userRef, {
      balance: balanceAfter,
      lastSeen: serverTimestamp()
    });

    // 3. Create mutation record
    const mutationRef = doc(collection(db, 'mutations'));
    transaction.set(mutationRef, {
      uid: deposit.uid,
      amount: deposit.amount,
      type: 'credit',
      description: `Deposit ${deposit.method} #${depositId.slice(0, 6)} disetujui`,
      balanceBefore,
      balanceAfter,
      createdAt: serverTimestamp()
    });

    return true;
  });
}

export async function rejectDeposit(depositId: string, adminUid: string, reason = 'Data transfer tidak valid'): Promise<void> {
  const depositRef = doc(db, 'deposits', depositId);
  await updateDoc(depositRef, {
    status: 'REJECTED',
    approvedAt: serverTimestamp(),
    approvedBy: adminUid,
    rejectionReason: reason
  });
}

// ORDERS & TRANSACTION
export async function createOrderWithDeduction(
  uid: string,
  productId: string,
  productName: string,
  unitPrice: number,
  quantity: number,
  totalCost: number,
  resultPayload: any
): Promise<{ id: string }> {
  const id = await executeOrderSuccessTransaction({
    uid,
    productId,
    productName,
    unitPrice,
    quantity,
    totalCost,
    resultPayload
  });
  return { id };
}

export async function executeOrderSuccessTransaction(params: {
  uid: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  resultPayload: any;
}): Promise<string> {
  return await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', params.uid);
    const userSnap = await transaction.get(userRef);

    if (!userSnap.exists()) {
      throw new Error('User tidak ditemukan.');
    }

    const userData = userSnap.data() as UserProfile;
    const currentBalance = userData.balance || 0;

    if (currentBalance < params.totalCost) {
      throw new Error('Saldo tidak mencukupi untuk melakukan transaksi.');
    }

    const balanceAfter = currentBalance - params.totalCost;
    const newTotalSpent = (userData.totalSpent || 0) + params.totalCost;
    const newOrderCount = (userData.orderCount || 0) + 1;

    // 1. Deduct user balance
    transaction.update(userRef, {
      balance: balanceAfter,
      totalSpent: newTotalSpent,
      orderCount: newOrderCount,
      lastSeen: serverTimestamp()
    });

    // 2. Create order record
    const orderRef = doc(collection(db, 'orders'));
    transaction.set(orderRef, {
      uid: params.uid,
      productId: params.productId,
      productName: params.productName,
      amount: params.unitPrice,
      quantity: params.quantity,
      total: params.totalCost,
      status: 'SUCCESS',
      result: params.resultPayload,
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp()
    });

    // 3. Create mutation record
    const mutationRef = doc(collection(db, 'mutations'));
    transaction.set(mutationRef, {
      uid: params.uid,
      amount: params.totalCost,
      type: 'debit',
      description: `Order ${params.productName} (${params.quantity}x)`,
      balanceBefore: currentBalance,
      balanceAfter,
      createdAt: serverTimestamp()
    });

    return orderRef.id;
  });
}

// Log failed order without deducting balance
export async function recordFailedOrder(params: {
  uid: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalCost: number;
  errorMessage: string;
}): Promise<string> {
  const col = collection(db, 'orders');
  const docRef = await addDoc(col, {
    uid: params.uid,
    productId: params.productId,
    productName: params.productName,
    amount: params.unitPrice,
    quantity: params.quantity,
    total: params.totalCost,
    status: 'FAILED',
    errorMessage: params.errorMessage,
    createdAt: serverTimestamp(),
    completedAt: serverTimestamp()
  });
  return docRef.id;
}

export function listenUserOrders(uid: string, callback: (orders: OrderRecord[]) => void): Unsubscribe {
  // Query by uid only to avoid requiring composite indexes in Firestore
  const q = query(
    collection(db, 'orders'),
    where('uid', '==', uid),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderRecord));
    list.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    callback(list);
  }, (err) => {
    console.warn('Notice listening user orders:', err?.message || err);
  });
}

export function listenAllOrders(callback: (orders: OrderRecord[]) => void): Unsubscribe {
  const q = query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as OrderRecord));
    callback(list);
  }, (err) => {
    console.warn('Notice listening all orders:', err?.message || err);
  });
}

// MUTATIONS
export function listenUserMutations(uid: string, callback: (mutations: MutationRecord[]) => void): Unsubscribe {
  // Query by uid only to avoid requiring composite indexes in Firestore
  const q = query(
    collection(db, 'mutations'),
    where('uid', '==', uid),
    limit(100)
  );

  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as MutationRecord));
    list.sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt));
    callback(list);
  }, (err) => {
    console.warn('Notice listening user mutations:', err?.message || err);
  });
}

// ADMIN USER MANAGEMENT & BALANCE ADJUSTMENT
export function listenAllUsers(callback: (users: UserProfile[]) => void): Unsubscribe {
  const q = query(collection(db, 'users'), limit(150));
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile));
    callback(list);
  }, (err) => {
    console.error('Error listening users:', err);
  });
}

export async function adminAdjustUserBalance(params: {
  adminUid: string;
  targetUid: string;
  deltaAmount: number;
  reason: string;
}): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', params.targetUid);
    const snap = await transaction.get(userRef);
    if (!snap.exists()) throw new Error('User tidak ditemukan.');

    const userData = snap.data() as UserProfile;
    const currentBalance = userData.balance || 0;
    const newBalance = Math.max(0, currentBalance + params.deltaAmount);

    transaction.update(userRef, {
      balance: newBalance,
      lastSeen: serverTimestamp()
    });

    const mutationRef = doc(collection(db, 'mutations'));
    transaction.set(mutationRef, {
      uid: params.targetUid,
      amount: Math.abs(params.deltaAmount),
      type: params.deltaAmount >= 0 ? 'credit' : 'debit',
      description: `Penyesuaian Admin: ${params.reason}`,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: serverTimestamp()
    });
  });
}

export async function adminToggleUserRole(targetUid: string, newRole: 'admin' | 'member'): Promise<void> {
  const userRef = doc(db, 'users', targetUid);
  await updateDoc(userRef, { role: newRole });
}

// REFERRAL SYSTEM
export async function addReferralBonus(uid: string, referralCode: string, bonusAmount = 500): Promise<void> {
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', uid);
    const snap = await transaction.get(userRef);
    if (!snap.exists()) throw new Error('Akun pengguna tidak ditemukan.');

    const userData = snap.data();
    if (userData.claimedReferral) {
      throw new Error('Anda sudah pernah mengklaim bonus referral sebelumnya.');
    }

    const currentBalance = Number(userData.balance) || 0;
    const newBalance = currentBalance + bonusAmount;

    transaction.update(userRef, {
      balance: newBalance,
      claimedReferral: true,
      referredBy: referralCode,
      lastSeen: serverTimestamp()
    });

    const mutationRef = doc(collection(db, 'mutations'));
    transaction.set(mutationRef, {
      uid,
      amount: bonusAmount,
      type: 'credit',
      description: `Bonus Referral (${referralCode})`,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      createdAt: serverTimestamp()
    });
  });
}

