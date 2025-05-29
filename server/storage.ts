import { jobs, users, towingServices, invoiceServices, companySettings, jobPhotos, type Job, type InsertJob, type User, type InsertUser, type TowingService, type CompanySettings, type InsertCompanySettings, type JobPhoto, type InsertJobPhoto } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // User authentication methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  
  // Job methods (now user-specific)
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<any>;
  getAllJobs(userId: number): Promise<Job[]>;
  getRecentJobs(userId: number, limit?: number): Promise<Job[]>;
  
  // Service methods
  getTowingServices(): Promise<TowingService[]>;
  updateTowingServiceRate(id: number, rate: string): Promise<void>;
  seedTowingServices(): Promise<void>;
  createInvoiceServices(jobId: number, services: { serviceId: number; cost: number }[]): Promise<void>;
  
  // Company settings (now user-specific)
  getCompanySettings(userId: number): Promise<CompanySettings | undefined>;
  updateCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  seedCompanySettings(userId: number): Promise<void>;
  
  // Photo methods
  addJobPhoto(jobId: number, photoPath: string, caption?: string): Promise<JobPhoto>;
  getJobPhotos(jobId: number): Promise<JobPhoto[]>;
  deleteJobPhoto(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User authentication methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

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

  async getAllJobs(userId: number): Promise<Job[]> {
    return await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt));
  }

  async getRecentJobs(userId: number, limit: number = 10): Promise<Job[]> {
    const result = await db.select().from(jobs).where(eq(jobs.userId, userId)).orderBy(desc(jobs.createdAt)).limit(limit);
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

    // Seed with the services from the user's specifications
    const servicesToSeed = [
      { name: "Contained Recovery/Winching", rate: "4.5" },
      { name: "Salvage/Debris Recovery", rate: "5.5" },
      { name: "Handle Complete Recovery", rate: "6.0" },
      { name: "Inclement Weather", rate: "2.5" },
      { name: "Night/Weekend/Holidays", rate: "2.5" },
      { name: "Travel Within 50 Miles", rate: "3.5" },
      { name: "Travel Beyond 50 Miles", rate: "6.5" },
      { name: "Wheels Higher Than Roof", rate: "2.0" },
      { name: "Embankment or Inclines", rate: "2.0" },
      { name: "Back Doors Open", rate: "2.0" },
      { name: "Tractor From Under Trailer", rate: "2.0" },
      { name: "Major Suspension Damage", rate: "6.0" },
      { name: "10 MPH Collision Factor", rate: "2.0" },
      { name: "30 MPH Collision Factor", rate: "3.0" },
      { name: "50 MPH Collision Factor", rate: "4.0" },
      { name: "70 MPH Collision Factor", rate: "5.0" }
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

  async getCompanySettings(userId: number): Promise<CompanySettings | undefined> {
    const [settings] = await db.select().from(companySettings).where(eq(companySettings.userId, userId)).limit(1);
    return settings || undefined;
  }

  async updateCompanySettings(insertSettings: InsertCompanySettings): Promise<CompanySettings> {
    const existing = await this.getCompanySettings(insertSettings.userId!);
    
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

  async seedCompanySettings(userId: number): Promise<void> {
    const existing = await this.getCompanySettings(userId);
    if (!existing) {
      await db.insert(companySettings).values({
        userId,
        companyName: "Professional Towing",
        companySubtitle: "Heavy Duty Recovery Services",
        companyLogo: "🚛",
        defaultFuelSurcharge: "15",
        invoiceFooter: "Thank you for your business!\nPayment due within 30 days"
      });
    }
  }

  async addJobPhoto(jobId: number, photoPath: string, caption?: string): Promise<JobPhoto> {
    const [photo] = await db
      .insert(jobPhotos)
      .values({
        jobId,
        photoPath,
        caption
      })
      .returning();
    return photo;
  }

  async getJobPhotos(jobId: number): Promise<JobPhoto[]> {
    return await db
      .select()
      .from(jobPhotos)
      .where(eq(jobPhotos.jobId, jobId))
      .orderBy(desc(jobPhotos.createdAt));
  }

  async deleteJobPhoto(id: number): Promise<void> {
    await db.delete(jobPhotos).where(eq(jobPhotos.id, id));
  }
}

export const storage = new DatabaseStorage();
