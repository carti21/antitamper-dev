export interface UserSearchParams {
    name?: string;
    email?: string;
    phone_number?: string;
    email_confirmed?: boolean;
    role?: string;
    status?: string;
    level?: string;
}

export interface FactorySearchParams {
    device_id?: string;
    serial_number?: string;
    phone_number?: string;
    factory_name?: string;
    factory_location?: string;
    region?: string;
    status?: string;
}

export interface DeviceDataSearchParams {
    device_id?: string;
    interrupt_occured?: 0 | 1;
    start_datetime?: Date | string;
    end_datetime?: Date | string;
    search_term?: string;
    sd_card_available?: boolean;
    state?:string
}

export interface LocationData {
    type: "Point";
    coordinates: [number, number];
}

export interface DeviceData {
    id: string;
    gps_location: LocationData;
    gsm_location: LocationData;
    gps_timestamp: string;
    gsm_timestamp: string;
    rtc_timestamp: string;
    factory: string;
    factory_name: string;
    factory_location: string;
    region: string | null;
    state: string;
    device_id: string;
    interrupt_type: string;
    interrupt_types: string;
    enclosure: string;
    calib_switch: string;
    sd_card_available: boolean;
    current_gps_timeout_ms: number;
    current_sleep_time_min: number;
    peripherals_turned_off: boolean;
    battery_voltage: number;
    rtc_datetime: number;
    gps_lat: string;
    gps_lon: string;
    gsm_lat: string;
    gsm_lon: string;
    gps_datetime: string;
    gsm_datetime: string;
    createdAt: string;
    updatedAt: string;
    gsm_map_url: string;
    gps_map_url: string;
}
