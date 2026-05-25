export interface Transaction {
  id: string;
  type: 'received' | 'sent' | 'swapped' | 'bought';
  asset: string;
  amount: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  value: string;
  change24h: number;
}

export interface MarketHistory {
  time: string;
  price: number;
}
