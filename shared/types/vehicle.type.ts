export interface Vehicle {
  id: number;
  registration: string;
  name: string;
  created_at: string;
}

export interface VehicleInput {
  registration: string;
  name: string;
}
