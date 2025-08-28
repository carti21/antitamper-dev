export type UserRole = 'sys-admin' | 'Manager' | 'ICT Manager' | 'FUM' | 'FS' | 'user';
export type UserLevel = 'FACTORY' | 'REGIONAL' | 'NATIONAL' | 'ADMIN' | 'UNAUTHORIZED';

export interface Device {
  id: string;
  deviceId: string;
  serialNumber: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
  geoLocation: {
    latitude: number;
    longitude: number;
  };
  factoryId: string;
  factoryName: string;
  regionId: string;
  regionName: string;
  manager: string;
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: string;
  }>;
  clerk: string;
  voltage: number;
  lastUpdated: string;
}

export interface Factory {
  id: string;
  name: string;
  region: string;
  manager: string;
  devices: Device[];
}

export interface Region {
  id: string;
  name: string;
  manager: string;
  factories: Factory[];
}

export interface DashboardPermissions {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}


