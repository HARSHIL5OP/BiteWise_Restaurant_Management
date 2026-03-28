import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Store, MapPin, Briefcase } from "lucide-react";

import { useToast } from "@/hooks/use-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { addRestaurant } from "@/services/restaurantService";

const formSchema = z.object({
  name: z.string().min(2, "Restaurant Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  ownerName: z.string().min(2, "Owner name is required"),
  ownerEmail: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  logoUrl: z.string().optional(),
  bannerImage: z.string().optional(),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  lat: z.coerce.number({ invalid_type_error: "Latitude must be a number" }),
  lng: z.coerce.number({ invalid_type_error: "Longitude must be a number" }),
  cuisineType: z.string().min(2, "At least one cuisine type is required"),
  priceRange: z.string({ required_error: "Price Range is required" }),
  openTime: z.string().min(1, "Opening time is required"),
  closeTime: z.string().min(1, "Closing time is required"),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddRestaurantForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      ownerName: "",
      ownerEmail: "",
      password: "",
      logoUrl: "",
      bannerImage: "",
      address: "",
      city: "",
      lat: 0,
      lng: 0,
      cuisineType: "",
      priceRange: "",
      openTime: "10:00",
      closeTime: "23:00",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      // Process cuisine types (comma separated string -> array)
      const cuisines = values.cuisineType
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);

      const restaurantData = {
        name: values.name,
        description: values.description,
        logoUrl: values.logoUrl || "",
        bannerImage: values.bannerImage || "",
        ownerName: values.ownerName,
        ownerEmail: values.ownerEmail,
        password: values.password,
        location: {
          address: values.address,
          city: values.city,
          lat: values.lat,
          lng: values.lng,
        },
        cuisineType: cuisines,
        priceRange: values.priceRange,
        operatingHours: {
          open: values.openTime,
          close: values.closeTime,
        },
      };

      await addRestaurant(restaurantData);

      toast({
        title: "Success",
        description: "Restaurant Added Successfully",
        variant: "default",
      });

      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add restaurant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card className="bg-[#0F172A] border-slate-800 shadow-xl relative overflow-hidden">
          <CardHeader className="bg-slate-900/40 border-b border-slate-800">
            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
              <Store className="w-5 h-5 text-orange-500" /> Basic Info
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Restaurant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. The Spicy Kitchen" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Owner Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. John Doe" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ownerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Owner Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="owner@bitewise.com" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Account Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="******" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-slate-300">Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="A short description about the restaurant..." 
                      className="resize-none bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="logoUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Logo Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/logo.png" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bannerImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Banner Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/banner.png" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Location Info */}
        <Card className="bg-[#0F172A] border-slate-800 shadow-xl relative overflow-hidden">
          <CardHeader className="bg-slate-900/40 border-b border-slate-800">
            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" /> Location Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-slate-300">Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main Street" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">City</FormLabel>
                  <FormControl>
                    <Input placeholder="New York" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Latitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="40.7128" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lng"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-300">Longitude</FormLabel>
                    <FormControl>
                      <Input type="number" step="any" placeholder="-74.0060" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Business Details */}
        <Card className="bg-[#0F172A] border-slate-800 shadow-xl relative overflow-hidden">
          <CardHeader className="bg-slate-900/40 border-b border-slate-800">
            <CardTitle className="text-lg text-white font-medium flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-500" /> Business Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="cuisineType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Cuisine Types (comma separated)</FormLabel>
                  <FormControl>
                    <Input placeholder="Indian, Chinese, Italian" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Price Range</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                        <SelectValue placeholder="Select price bracket" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                      <SelectItem value="₹">₹ - Budget</SelectItem>
                      <SelectItem value="₹₹">₹₹ - Moderate</SelectItem>
                      <SelectItem value="₹₹₹">₹₹₹ - Expensive</SelectItem>
                      <SelectItem value="₹₹₹₹">₹₹₹₹ - Fine Dining</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="openTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Opening Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50 [color-scheme:dark]" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="closeTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Closing Time</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50 [color-scheme:dark]" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <div className="flex gap-4 items-center justify-end">
          <Button 
            type="button" 
            variant="ghost" 
            onClick={() => form.reset()}
            className="text-slate-400 hover:text-white"
            disabled={isSubmitting}
          >
            Reset Form
          </Button>
          <Button 
            type="submit" 
            className="bg-orange-500 hover:bg-orange-600 text-white min-w-[200px] shadow-[0_0_20px_rgba(249,115,22,0.4)]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
              </>
            ) : "Submit Restaurant"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
