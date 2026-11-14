export enum ViewState {
  LANDING = 'LANDING',
  LOGIN = 'LOGIN',
  MENU = 'MENU',
  ADMIN = 'ADMIN',
  PLACEHOLDER = 'PLACEHOLDER'
}

export type Language = 'ms' | 'en';

export interface MenuItem {
  id: string;
  title: string;
  subtitle?: string;
  badge?: string;
  icon: any;
  color: string;
  action?: () => void;
}

export enum LoadingState {
  IDLE = 'IDLE',
  LOADING = 'LOADING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}
