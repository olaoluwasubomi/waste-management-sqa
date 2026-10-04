"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormField, FormItem, FormControl, FormMessage, FormLabel } from "@/components/ui/form";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue,} from "@/components/ui/select";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { triggerRefresh } from "@/lib/useRefresh";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const schema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email(),
  phone: z.string().min(10, "Valid phone required"),
  address:z.string().min(5, "Address required"),
  // role: z.enum(["USER", "COLLECTOR"]),
});

type FormValues = z.infer<typeof schema>;

export default function CreateUserModal({ open, setOpen }: Props) {
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);


  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address:"",
      // role:"USER",
    },
  });

  useEffect(() => {
  console.log("MODAL MOUNTED");
}, []);


// useEffect(() => {
//   if (!open) return;

//   const fetchRoles = async () => {
//     try {
//       const res = await fetch("/api/admin/roles");
//       const data = await res.json();
//       console.log("ROLES:", data);
//       setRoles(data);
//     } catch (err) {
//       console.error("Failed to load roles", err);
//     }
//   };

//   fetchRoles();
// }, [open]);


//   async function onSubmit(values: FormValues) {
//     try {
//       setLoading(true);

//       const res = await fetch("/api/admin/users", {
//         method: "POST",
//         body: JSON.stringify(values),
//       });

//       const data = await res.json();

//       if (!res.ok) throw new Error(data.error);

//       alert("User created successfully");

//       form.reset();
//       setOpen(false);

//     } catch (err: any) {
//       alert(err.message);
//     } finally {
//       setLoading(false);
//     }
//   }

const handleSubmit = async (data: FormValues) => {
    try{
        setLoading(true);
        const response = await api.post("/admin/create-users", data);
        toast.success(`User created successfully. Temporary password: ${response.data.tempPassword}`);
        triggerRefresh();
        form.reset();
        setOpen(false);
        // if (response.status === 200) {
          
        // }
    } catch (error:any) {
        toast.error(error.response?.data?.error || "An error occurred");
    } finally {
        setLoading(false);
    }
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">

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

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="john@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street, City" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



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

            {/* <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>User Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        </FormControl>

                        <SelectContent>
                        {roles.map((role) => (
                            <SelectItem key={role} value={role}>
                                {role}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
            /> */}


            <Button className="w-full" disabled={loading}>
              {loading ? "Creating..." : "Create User"}
            </Button>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
