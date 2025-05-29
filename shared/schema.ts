import { pgTable, text, serial, integer, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Job information schema
export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  customerName: text("customer_name").notNull(),
  invoiceNumber: text("invoice_number").notNull(),
  vehicleType: text("vehicle_type").notNull(),
  vehicleWeight: integer("vehicle_weight").notNull(),
  problemDescription: text("problem_description").notNull(),
  fuelSurcharge: decimal("fuel_surcharge", { precision: 5, scale: 2 }).notNull().default("15"),
});

export const insertJobSchema = createInsertSchema(jobs).omit({
  id: true,
});

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

// Service schema for future use if needed
export const towingServices = pgTable("towing_services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rate: decimal("rate", { precision: 5, scale: 2 }).notNull(),
});

export type TowingService = typeof towingServices.$inferSelect;

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
