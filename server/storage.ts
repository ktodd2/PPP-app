import { jobs, users, companies, towingServices, invoiceServices, companySettings, jobPhotos, subcontractors, type Job, type InsertJob, type User, type InsertUser, type Company, type InsertCompany, type TowingService, type CompanySettings, type InsertCompanySettings, type JobPhoto, type InsertJobPhoto, type Subcontractor } from "@shared/schema";
import { db } from "./db";
import { eq, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // User authentication methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserCompany(userId: number, companyId: number | null): Promise<User>;
  updateUserRole(userId: number, role: "admin" | "user"): Promise<User>;
  deleteUser(userId: number): Promise<void>;
  
  // Company methods
  createCompany(insertCompany: InsertCompany): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  getCompany(id: number): Promise<Company | undefined>;
  deleteCompany(id: number): Promise<void>;
  
  // Job methods (now company-aware)
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<any>;
  getAllJobs(userId: number): Promise<Job[]>;
  getCompanyJobs(companyId: number): Promise<Job[]>;
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
  
  // Subcontractor methods
  addJobSubcontractor(jobId: number, name: string, workPerformed: string, price: string): Promise<Subcontractor>;
  getJobSubcontractors(jobId: number): Promise<Subcontractor[]>;
  deleteJobSubcontractor(id: number): Promise<void>;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserCompany(userId: number, companyId: number | null): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ companyId })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: number, role: "admin" | "user"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async deleteUser(userId: number): Promise<void> {
    await db.delete(users).where(eq(users.id, userId));
  }

  // Company methods
  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db
      .insert(companies)
      .values(insertCompany)
      .returning();
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.createdAt));
  }

  async getCompany(id: number): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company || undefined;
  }

  async deleteCompany(id: number): Promise<void> {
    await db.delete(companies).where(eq(companies.id, id));
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

  async getCompanyJobs(companyId: number): Promise<Job[]> {
    // Get all users in the company
    const companyUsers = await db.select().from(users).where(eq(users.companyId, companyId));
    const userIds = companyUsers.map((u: User) => u.id);
    
    if (userIds.length === 0) {
      return [];
    }
    
    // Get all jobs from those users
    return await db.select().from(jobs).where(inArray(jobs.userId, userIds)).orderBy(desc(jobs.createdAt));
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
        .set({ 
          ...insertSettings, 
          userId: insertSettings.userId,
          updatedAt: new Date() 
        })
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

  async addJobSubcontractor(jobId: number, name: string, workPerformed: string, price: string): Promise<Subcontractor> {
    const [subcontractor] = await db
      .insert(subcontractors)
      .values({
        jobId,
        name,
        workPerformed,
        price
      })
      .returning();
    return subcontractor;
  }

  async getJobSubcontractors(jobId: number): Promise<Subcontractor[]> {
    return await db
      .select()
      .from(subcontractors)
      .where(eq(subcontractors.jobId, jobId));
  }

  async deleteJobSubcontractor(id: number): Promise<void> {
    await db.delete(subcontractors).where(eq(subcontractors.id, id));
  }
}

export const storage = new DatabaseStorage();
