"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import { toast } from "sonner";
import { triggerRefresh } from "@/lib/useRefresh";
import { UserAddress } from "../types";

const schema = z.object({
  street: z.string().min(5, "Street address must be at least 5 characters"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  postalCode: z.string().optional(),
  country: z.string().min(2, "Country is required"),
});

type FormValues = z.infer<typeof schema>;

interface AddressFormModalProps {
  open: boolean;
  onClose: () => void;
  address?: UserAddress | null;
  onSuccess: () => void;
}

export default function AddressFormModal({
  open,
  onClose,
  address,
  onSuccess,
}: AddressFormModalProps) {
  const isEditing = !!address;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      street: "",
      city: "",
      state: "",
      postalCode: "",
      country: "Nigeria",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        street: address?.street ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        postalCode: address?.postalCode ?? "",
        country: address?.country ?? "Nigeria",
      });
    }
  }, [open, address, form]);

  const handleSubmit = async (values: FormValues) => {
    try {
      if (isEditing && address) {
        await api.put(`/user/addresses/${address.id}`, values);
        toast.success("Address updated successfully");
      } else {
        await api.post("/user/addresses", values);
        toast.success("Address added successfully");
      }

      triggerRefresh();
      onSuccess();
      onClose();
      form.reset();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Something went wrong";
      toast.error(message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Address" : "Add New Address"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="street"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Street Address</FormLabel>
                  <FormControl>
                    <Input placeholder="12 Admiralty Way" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input placeholder="Lagos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="postalCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal Code (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="101241" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="Nigeria" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Add Address"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
