import { pgTable, text, serial, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Job information schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
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

// Relations
export const jobsRelations = relations(jobs, ({ many }) => ({
  invoiceServices: many(invoiceServices),
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
