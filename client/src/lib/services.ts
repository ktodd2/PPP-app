// Service rates from the original application
export interface TowingService {
  id: number;
  name: string;
  rate: number;
}

export const services: TowingService[] = [
  { id: 1, name: "Normal Recovery (On or Near Highway)", rate: 4.0 },
  { id: 2, name: "Contained Recovery/Winching", rate: 4.0 },
  { id: 3, name: "Salvage/Debris Recovery", rate: 5.5 },
  { id: 4, name: "Handle Complete Recovery", rate: 6.0 },
  { id: 5, name: "Total Loss Recovery", rate: 5.0 },
  { id: 6, name: "Rollover", rate: 4.0 },
  { id: 7, name: "Inclement Weather", rate: 2.5 },
  { id: 8, name: "Nights/Weekends/Holidays", rate: 2.5 },
  { id: 9, name: "Travel Within 50 Miles", rate: 3.5 },
  { id: 10, name: "Travel Beyond 50 Miles", rate: 6.5 },
  { id: 11, name: "Wheels Higher than Roof", rate: 2.0 },
  { id: 12, name: "Embankment or Inclines", rate: 4.5 },
  { id: 13, name: "Back Doors Open", rate: 2.0 },
  { id: 14, name: "Tractor from Under Trailer", rate: 2.0 },
  { id: 15, name: "Major Suspension Damage", rate: 6.0 },
  { id: 16, name: "10 MPH Collision Factor", rate: 2.0 },
  { id: 17, name: "30 MPH Collision Factor", rate: 3.0 },
  { id: 18, name: "50 MPH Collision Factor", rate: 4.0 },
  { id: 19, name: "70+ MPH Collision Factor", rate: 5.0 }
];
