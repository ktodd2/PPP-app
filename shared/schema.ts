import { pgTable, text, serial, integer, decimal, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Job information schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  customerName: text("customer_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleWeight: integer("vehicle_weight").notNull(),
  problemDescription: text("problem_description").notNull(),
  fuelSurcharge: decimal("fuel_surcharge", { precision: 5, scale: 2 }).notNull().default("15"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
  createdAt: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Service schema
export const towingServices = pgTable("towing_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
});

export type TowingService = typeof towingServices.$inferSelect;

// Invoice services junction table
export const invoiceServices = pgTable("invoice_services", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id).notNull(),
  serviceId: integer("service_id").references(() => towingServices.id).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
});

export type InvoiceService = typeof invoiceServices.$inferSelect;

// Company settings table
export const companySettings = pgTable("company_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  companyName: text("company_name").notNull().default("Professional Towing"),
  companySubtitle: text("company_subtitle").notNull().default("Heavy Duty Recovery Services"),
  companyLogo: text("company_logo").default("🚛"),
  address: text("address"),
  phone: text("phone"),
  email: text("email"),
  website: text("website"),
  defaultFuelSurcharge: decimal("default_fuel_surcharge", { precision: 5, scale: 2 }).notNull().default("15"),
  invoiceFooter: text("invoice_footer").default("Thank you for your business!\nPayment due within 30 days"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertCompanySettingsSchema = createInsertSchema(companySettings).omit({
  id: true,
  updatedAt: true,
});

export type InsertCompanySettings = z.infer<typeof insertCompanySettingsSchema>;
export type CompanySettings = typeof companySettings.$inferSelect;

export const jobPhotos = pgTable("job_photos", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  photoPath: text("photo_path").notNull(),
  caption: text("caption"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type JobPhoto = typeof jobPhotos.$inferSelect;
export type InsertJobPhoto = typeof jobPhotos.$inferInsert;

export const subcontractors = pgTable("subcontractors", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => jobs.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  workPerformed: varchar("work_performed", { length: 500 }).notNull(),
  price: varchar("price", { length: 20 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

export type Subcontractor = typeof subcontractors.$inferSelect;
export type InsertSubcontractor = typeof subcontractors.$inferInsert;

// Relations
export const jobsRelations = relations(jobs, ({ many }) => ({
  invoiceServices: many(invoiceServices),
  photos: many(jobPhotos),
  subcontractors: many(subcontractors),
}));

export const towingServicesRelations = relations(towingServices, ({ many }) => ({
  invoiceServices: many(invoiceServices),
}));

export const invoiceServicesRelations = relations(invoiceServices, ({ one }) => ({
  job: one(jobs, {
    fields: [invoiceServices.jobId],
    references: [jobs.id],
  }),
  service: one(towingServices, {
    fields: [invoiceServices.serviceId],
    references: [towingServices.id],
  }),
}));

export const jobPhotosRelations = relations(jobPhotos, ({ one }) => ({
  job: one(jobs, {
    fields: [jobPhotos.jobId],
    references: [jobs.id],
  }),
}));

export const subcontractorsRelations = relations(subcontractors, ({ one }) => ({
  job: one(jobs, {
    fields: [subcontractors.jobId],
    references: [jobs.id],
  }),
}));

// Invoice calculation types
export const invoiceSchema = z.object({
  customerName: z.string().min(1, "Customer name is required"),
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  vehicleType: z.string().min(1, "Vehicle type is required"),
  vehicleWeight: z.number().min(1, "Vehicle weight must be greater than 0"),
  problemDescription: z.string().min(1, "Problem description is required"),
  fuelSurcharge: z.number().min(0).max(100, "Fuel surcharge must be between 0 and 100"),
  selectedServices: z.record(z.boolean()),
});

export type InvoiceFormData = z.infer<typeof invoiceSchema>;
