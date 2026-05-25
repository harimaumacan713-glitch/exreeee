import { Asset, Transaction, MarketHistory } from './types';

export const ASSETS: Asset[] = [
  { id: '1', symbol: 'BTC', name: 'Bitcoin', balance: '0.852 BTC', value: '56,066.04', change24h: 5.24 },
  { id: '2', symbol: 'ETH', name: 'Ethereum', balance: '9.451 ETH', value: '31,148.12', change24h: 3.12 },
  { id: '3', symbol: 'USDT', name: 'Tether', balance: '24,918.49 USDT', value: '24,918.49', change24h: 0.00 },
  { id: '4', symbol: 'SOL', name: 'Solana', balance: '85.34 SOL', value: '12,459.83', change24h: 12.4 },
];

export const TRANSACTIONS: Transaction[] = [
  { id: '1', type: 'received', asset: 'BTC', amount: '+0.125 BTC', date: 'Oct 24, 2023 • 14:22', status: 'completed' },
  { id: '2', type: 'sent', asset: 'ETH', amount: '-1.50 ETH', date: 'Oct 23, 2023 • 09:15', status: 'pending' },
  { id: '3', type: 'swapped', asset: 'SOL/USDT', amount: '12.5 SOL', date: 'Oct 21, 2023 • 18:40', status: 'completed' },
];

export const PORTFOLIO_STATS = [
  { name: 'BTC', value: 45, color: '#adc6ff' },
  { name: 'ETH', value: 25, color: '#4edea3' },
  { name: 'USDT', value: 20, color: '#ffb3ad' },
  { name: 'SOL', value: 10, color: '#d8e2ff' },
];

export const MOCK_HISTORY: MarketHistory[] = [
  { time: 'MON', price: 80 },
  { time: 'TUE', price: 75 },
  { time: 'WED', price: 85 },
  { time: 'THU', price: 40 },
  { time: 'FRI', price: 55 },
  { time: 'SAT', price: 20 },
  { time: 'SUN', price: 90 },
];
