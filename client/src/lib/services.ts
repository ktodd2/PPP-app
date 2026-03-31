// Service rates from the original application
export interface TowingService {
  id: number;
  name: string;
  rate: number;
}

export const services: TowingService[] = [
  { id: 1, name: "Contained Recovery/Winching", rate: 5.5 },
  { id: 2, name: "Salvage/Debris Recovery", rate: 6.5 },
  { id: 3, name: "Handle Complete Recovery", rate: 7.0 },
  { id: 4, name: "Inclement Weather", rate: 3.5 },
  { id: 5, name: "Nights/Weekends/Holidays", rate: 3.5 },
  { id: 6, name: "Travel Within 50 Miles", rate: 4.5 },
  { id: 7, name: "Travel Beyond 50 Miles", rate: 7.5 },
  { id: 8, name: "Wheels Higher than Roof", rate: 3.0 },
  { id: 9, name: "Embankment or Inclines", rate: 3.0 },
  { id: 10, name: "Back Doors Open", rate: 3.0 },
  { id: 11, name: "Tractor from Under Trailer", rate: 3.0 },
  { id: 12, name: "Major Suspension Damage", rate: 7.0 },
  { id: 13, name: "10 MPH Collision Factor", rate: 3.0 },
  { id: 14, name: "30 MPH Collision Factor", rate: 4.0 },
  { id: 15, name: "50 MPH Collision Factor", rate: 5.0 },
  { id: 16, name: "70 MPH Collision Factor", rate: 6.0 }
];
