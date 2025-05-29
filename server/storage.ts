import { jobs, towingServices, invoiceServices, companySettings, type Job, type InsertJob, type TowingService, type CompanySettings, type InsertCompanySettings } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<any>;
  getAllJobs(): Promise<Job[]>;
  getRecentJobs(limit?: number): Promise<Job[]>;
  getTowingServices(): Promise<TowingService[]>;
  updateTowingServiceRate(id: number, rate: string): Promise<void>;
  seedTowingServices(): Promise<void>;
  createInvoiceServices(jobId: number, services: { serviceId: number; cost: number }[]): Promise<void>;
  getCompanySettings(): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  seedCompanySettings(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createJob(insertJob: InsertJob): Promise<Job> {
    const [job] = await db
      .insert(jobs)
      .values(insertJob)
      .returning();
    return job;
  }

  async getJob(id: number): Promise<any> {
    const [job] = await db.select().from(jobs).where(eq(jobs.id, id));
    if (!job) return undefined;
    
    // Get the invoice services for this job
    const services = await db
      .select()
      .from(invoiceServices)
      .where(eq(invoiceServices.jobId, id));
    
    return {
      ...job,
      invoiceServices: services
    };
  }

  async getAllJobs(): Promise<Job[]> {
    return await db.select().from(jobs);
  }

  async getRecentJobs(limit: number = 10): Promise<Job[]> {
    const result = await db.select().from(jobs).orderBy(desc(jobs.createdAt)).limit(limit);
    return result;
  }

  async getTowingServices(): Promise<TowingService[]> {
    return await db.select().from(towingServices);
  }

  async updateTowingServiceRate(id: number, rate: string): Promise<void> {
    await db.update(towingServices).set({ rate }).where(eq(towingServices.id, id));
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

  async getCompanySettings(): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).limit(1);
    return settings || undefined;
  }

  async updateCompanySettings(insertSettings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings();
    
    if (existing) {
      const [updated] = await db
        .update(companySettings)
        .set({ ...insertSettings, updatedAt: new Date() })
        .where(eq(companySettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(companySettings)
        .values(insertSettings)
        .returning();
      return created;
    }
  }

  async seedCompanySettings(): Promise<void> {
    const existing = await this.getCompanySettings();
    if (!existing) {
      await db.insert(companySettings).values({
        companyName: "Professional Towing",
        companySubtitle: "Heavy Duty Recovery Services",
        companyLogo: "🚛",
        defaultFuelSurcharge: "15",
        invoiceFooter: "Thank you for your business!\nPayment due within 30 days"
      });
    }
  }
}

export const storage = new DatabaseStorage();
