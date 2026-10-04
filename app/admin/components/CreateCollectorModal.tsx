"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel,
} from "@/components/ui/form";
import { useState } from "react";
import api from "@/lib/api";
import { triggerRefresh } from "@/lib/useRefresh";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

/* ---------------- Validation ---------------- */

const schema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email(),
  phone: z.string().min(10, "Valid phone required"),
  zone: z.string().min(2, "Zone is required"),
});

type FormValues = z.infer<typeof schema>;

/* ---------------- Component ---------------- */

export default function CreateCollectorModal({ open, setOpen }: Props) {
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      zone: "",
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      setLoading(true);

      const res = await api.post("/admin/create-collectors", values);

      toast.success(`Collector created successfully.\nTemporary password: ${res.data.tempPassword}`);     

      triggerRefresh();

      form.reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create collector");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Collector</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

            {/* First Name */}
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Last Name */}
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="collector@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Phone */}
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="08012345678" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Zone */}
            <FormField
              control={form.control}
              name="zone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assigned Zone</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lekki Phase 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create Collector"}
            </Button>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}