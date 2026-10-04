"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormLabel
} from "@/components/ui/form";

import { useState } from "react";
import api from "@/lib/api";
import { triggerRefresh } from "@/lib/useRefresh";
import { toast } from "sonner";

interface Props {
  open: boolean;
  setOpen: (value: boolean) => void;
}

const schema = z.object({
  name: z.string().min(2, "Waste name is required"),
  description: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  image: z.any().optional(),
  isActive: z.boolean()
});

type FormValues = z.infer<typeof schema>;

export default function CreateWasteTypeModal({ open, setOpen }: Props) {

  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      price: 1,
      image: undefined,
      isActive: true
    }
  });

  const handleSubmit = async (data: FormValues) => {
    try {

      setLoading(true);

      const formData = new FormData();

      formData.append("name", data.name);
      formData.append("description", data.description || "");
      formData.append("price", String(data.price));
      formData.append("isActive", String(data.isActive));

      if (data.image?.[0]) {
        formData.append("image", data.image[0]);
      }

      await api.post("/admin/create-wastetypes", formData);

      toast.success("Waste type created successfully");
      // console.log()

      triggerRefresh();

      form.reset();

      setOpen(false);

    } catch (error: any) {

      toast.error(
        error.response?.data?.error || "Failed to create waste type"
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">

        <DialogHeader>
          <DialogTitle>Create Waste Type</DialogTitle>
        </DialogHeader>

        <Form {...form}>

          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-5"
          >

            {/* Waste Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waste Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Plastic"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Plastic bottles and containers"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price */}
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₦ per KG)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="200"
                      value={field.value}
                      onChange={(e) =>
                        field.onChange(Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sample Image</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        field.onChange(e.target.files)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status Toggle */}
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <FormLabel>Status (Active)</FormLabel>

                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />

                </FormItem>
              )}
            />

            <Button
              className="w-full"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Waste Type"}
            </Button>

          </form>

        </Form>

      </DialogContent>
    </Dialog>
  );
}