import { jobs, towingServices, invoiceServices, type Job, type InsertJob, type TowingService } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getAllJobs(): Promise<Job[]>;
  getTowingServices(): Promise<TowingService[]>;
  seedTowingServices(): Promise<void>;
  createInvoiceServices(jobId: number, services: { serviceId: number; cost: number }[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJob(id: number): Promise<Job | undefined> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    return job || undefined;
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getTowingServices(): Promise<TowingService[]> {
    return await db.select().from(towingServices);
  }

  async seedTowingServices(): Promise<void> {
    // Check if services already exist
    const existingServices = await this.getTowingServices();
    if (existingServices.length > 0) {
      return; // Already seeded
    }

    // Seed with the services from the original app
    const servicesToSeed = [
      { name: "Normal Recovery (On or Near Highway)", rate: "4.0" },
      { name: "Contained Recovery/Winching", rate: "4.0" },
      { name: "Salvage/Debris Recovery", rate: "5.5" },
      { name: "Handle Complete Recovery", rate: "6.0" },
      { name: "Total Loss Recovery", rate: "5.0" },
      { name: "Rollover", rate: "4.0" },
      { name: "Inclement Weather", rate: "2.5" },
      { name: "Nights/Weekends/Holidays", rate: "2.5" },
      { name: "Travel Within 50 Miles", rate: "3.5" },
      { name: "Travel Beyond 50 Miles", rate: "6.5" },
      { name: "Wheels Higher than Roof", rate: "2.0" },
      { name: "Embankment or Inclines", rate: "4.5" },
      { name: "Back Doors Open", rate: "2.0" },
      { name: "Tractor from Under Trailer", rate: "2.0" },
      { name: "Major Suspension Damage", rate: "6.0" },
      { name: "10 MPH Collision Factor", rate: "2.0" },
      { name: "30 MPH Collision Factor", rate: "3.0" },
      { name: "50 MPH Collision Factor", rate: "4.0" },
      { name: "70+ MPH Collision Factor", rate: "5.0" }
    ];

    await db.insert(towingServices).values(servicesToSeed);
  }

  async createInvoiceServices(jobId: number, services: { serviceId: number; cost: number }[]): Promise<void> {
    if (services.length > 0) {
      const invoiceServiceData = services.map(service => ({
        jobId,
        serviceId: service.serviceId,
        cost: service.cost.toString()
      }));
      
      await db.insert(invoiceServices).values(invoiceServiceData);
    }
  }
}

export const storage = new DatabaseStorage();
