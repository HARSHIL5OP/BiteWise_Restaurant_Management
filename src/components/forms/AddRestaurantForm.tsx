import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, Store, MapPin, Briefcase, Check, Upload, ImageIcon } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Switch } from "@/components/ui/switch";
import { MapPicker } from "@/components/MapPicker";

import { addRestaurant } from "@/services/restaurantService";
import { uploadToCloudinary } from "@/lib/cloudinary";

const formSchema = z.object({
  name: z.string().min(2, "Restaurant Name must be at least 2 characters"),
  description: z.string().min(5, "Description must be at least 5 characters"),
  firstName: z.string().min(2, "First name is required"),
  lastName: z.string().min(2, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  logoUrl: z.any().optional(),
  bannerImage: z.any().optional(),
  address: z.string().min(3, "Address is required"),
  city: z.string().min(2, "City is required"),
  lat: z.coerce.number({ invalid_type_error: "Latitude must be a number" }),
  lng: z.coerce.number({ invalid_type_error: "Longitude must be a number" }),
  cuisineType: z.array(z.string()).min(1, "At least one cuisine type is required"),
  averagePriceForTwo: z.coerce.number({ invalid_type_error: "Average price is required" }),
  openTime: z.string().min(1, "Opening time is required"),
  closeTime: z.string().min(1, "Closing time is required"),
  restaurantType: z.string().min(1, "Dietary Service is required"),
  outletType: z.string().min(1, "Outlet Type is required"),
  isJainAvailable: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function AddRestaurantForm({ onSuccess }: { onSuccess?: () => void }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableCuisines, setAvailableCuisines] = useState<string[]>([]);
  const [newCuisine, setNewCuisine] = useState("");

  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        const snapshot = await getDocs(collection(db, "restaurants"));
        const cuisinesSet = new Set<string>();
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.cuisineType && Array.isArray(data.cuisineType)) {
            data.cuisineType.forEach((c: string) => cuisinesSet.add(c.trim()));
          }
        });
        setAvailableCuisines(Array.from(cuisinesSet).filter(Boolean));
      } catch (error) {
        console.error("Error fetching cuisines", error);
      }
    };
    fetchCuisines();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      password: "",
      logoUrl: "",
      bannerImage: "",
      address: "",
      city: "",
      lat: 0,
      lng: 0,
      cuisineType: [],
      averagePriceForTwo: "" as any,
      openTime: "10:00",
      closeTime: "23:00",
      restaurantType: "Veg",
      outletType: "Restaurant",
      isJainAvailable: false,
    },
  });

  const watchAddress = form.watch("address");
  const watchCity = form.watch("city");

  const handleGeocode = async () => {
    if (!watchAddress || watchAddress.length < 3) {
      alert("Please enter a valid address to find on map.");
      return;
    }
    try {
      // First attempt: Address + City
      let query = `${watchAddress}${watchCity ? `, ${watchCity}` : ''}`;
      let res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
      let data = await res.json();
      
      // Second attempt: Just City if first fails
      if ((!data || data.length === 0) && watchCity) {
        console.log("Full address failed, trying just city...");
        res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(watchCity)}&limit=1`);
        data = await res.json();
        if (data && data.length > 0) {
            alert("Could not find exact street address, but centered map on the City. Please drag the pin to your exact location.");
        }
      }

      if (data && data.length > 0) {
        const newLat = parseFloat(data[0].lat);
        const newLng = parseFloat(data[0].lon);
        form.setValue("lat", newLat);
        form.setValue("lng", newLng);
      } else {
        alert("Could not find coordinates for this address or city. Please refine it or select manually on the map.");
      }
    } catch (err) {
      console.error("Geocoding error", err);
      alert("Error connecting to geocoding service.");
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      let finalLogoUrl = values.logoUrl;
      if (values.logoUrl && typeof values.logoUrl === 'object') {
          finalLogoUrl = await uploadToCloudinary(values.logoUrl);
      } else {
          finalLogoUrl = "";
      }

      let finalBannerImage = values.bannerImage;
      if (values.bannerImage && typeof values.bannerImage === 'object') {
          finalBannerImage = await uploadToCloudinary(values.bannerImage);
      } else {
          finalBannerImage = "";
      }

      const restaurantData = {
        name: values.name,
        description: values.description,
        logoUrl: finalLogoUrl,
        bannerImage: finalBannerImage,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        password: values.password,
        location: {
          address: values.address,
          city: values.city,
          lat: values.lat,
          lng: values.lng,
        },
        cuisineType: values.cuisineType,
        averagePriceForTwo: values.averagePriceForTwo,
        restaurantType: values.restaurantType,
        outletType: values.outletType,
        isJainAvailable: values.isJainAvailable,
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

  const handleAddCuisine = () => {
    if (newCuisine.trim() && !availableCuisines.includes(newCuisine.trim())) {
      setAvailableCuisines([...availableCuisines, newCuisine.trim()]);
      const currentCuisines = form.getValues("cuisineType") || [];
      form.setValue("cuisineType", [...currentCuisines, newCuisine.trim()], { shouldValidate: true });
      setNewCuisine("");
    }
  };

  const toggleCuisine = (cuisine: string) => {
    const current = form.getValues("cuisineType") || [];
    if (current.includes(cuisine)) {
      form.setValue("cuisineType", current.filter(c => c !== cuisine), { shouldValidate: true });
    } else {
      form.setValue("cuisineType", [...current, cuisine], { shouldValidate: true });
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
              name="outletType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Type of Food Outlet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                        <SelectValue placeholder="Select Outlet Type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                      <SelectItem value="Restaurant">Restaurant</SelectItem>
                      <SelectItem value="Cafe">Cafe</SelectItem>
                      <SelectItem value="QSR">QSR (Quick Service)</SelectItem>
                      <SelectItem value="Food Truck">Food Truck</SelectItem>
                      <SelectItem value="Bakery">Bakery</SelectItem>
                      <SelectItem value="Cloud Kitchen">Cloud Kitchen</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. John" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g. Doe" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="owner@bitewise.com" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1 234 567 8900" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
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
                  <FormLabel className="text-slate-300">Logo Image</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative group bg-slate-900/50">
                        <input type="file" accept="image/*"
                            onChange={e => field.onChange(e.target?.files?.[0] || field.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-orange-500">
                            {field.value ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 shadow-sm mx-auto">
                                    {typeof field.value === 'string' ? (
                                        <img src={field.value} alt="Logo preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={URL.createObjectURL(field.value)} alt="Logo upload preview" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Upload size={24} />
                                    <span className="text-sm">Click to upload logo image</span>
                                </>
                            )}
                        </div>
                    </div>
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
                  <FormLabel className="text-slate-300">Banner Image</FormLabel>
                  <FormControl>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-4 text-center hover:border-orange-500/50 transition-colors cursor-pointer relative group bg-slate-900/50">
                        <input type="file" accept="image/*"
                            onChange={e => field.onChange(e.target?.files?.[0] || field.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-orange-500">
                            {field.value ? (
                                <div className="w-full h-16 rounded-lg overflow-hidden border border-slate-700 shadow-sm">
                                    {typeof field.value === 'string' ? (
                                        <img src={field.value} alt="Banner preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <img src={URL.createObjectURL(field.value)} alt="Banner upload preview" className="w-full h-full object-cover" />
                                    )}
                                </div>
                            ) : (
                                <>
                                    <ImageIcon size={24} />
                                    <span className="text-sm">Click to upload banner image</span>
                                </>
                            )}
                        </div>
                    </div>
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
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
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
                      <div className="flex gap-2">
                        <Input placeholder="New York" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                        <button 
                            type="button" 
                            onClick={handleGeocode}
                            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md whitespace-nowrap text-sm font-bold transition-colors"
                        >
                            Find on Map
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="dark">
              <MapPicker 
                lat={form.getValues("lat")}
                lng={form.getValues("lng")}
                onChange={(lat, lng, address) => {
                  form.setValue("lat", lat, { shouldValidate: true });
                  form.setValue("lng", lng, { shouldValidate: true });
                  if (address && !form.getValues("address")) {
                    form.setValue("address", address, { shouldValidate: true });
                  }
                }}
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
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-slate-300">Cuisine Types</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {availableCuisines.map((cuisine) => {
                          const isSelected = field.value.includes(cuisine);
                          return (
                            <div 
                              key={cuisine}
                              onClick={() => toggleCuisine(cuisine)}
                              className={`px-3 py-1.5 rounded-full text-sm cursor-pointer transition-colors border ${isSelected ? 'bg-orange-500/20 border-orange-500 text-orange-500' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                            >
                              {cuisine}
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Add new cuisine..." 
                          value={newCuisine}
                          onChange={(e) => setNewCuisine(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50 w-full max-w-xs" 
                        />
                        <Button type="button" onClick={handleAddCuisine} variant="secondary" className="bg-slate-800 text-white hover:bg-slate-700">
                          Add
                        </Button>
                      </div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="restaurantType"
              render={({ field }) => {
                const isVeg = field.value === "Veg" || field.value === "Both";
                const isNonVeg = field.value === "Non-Veg" || field.value === "Both";

                const handleToggle = (type: 'veg' | 'non-veg') => {
                  if (type === 'veg') {
                    if (isVeg && isNonVeg) field.onChange("Non-Veg");
                    else if (!isVeg && isNonVeg) field.onChange("Both");
                    else if (!isVeg && !isNonVeg) field.onChange("Veg");
                  } else {
                    if (isNonVeg && isVeg) field.onChange("Veg");
                    else if (!isNonVeg && isVeg) field.onChange("Both");
                    else if (!isNonVeg && !isVeg) field.onChange("Non-Veg");
                  }
                };

                return (
                  <FormItem>
                    <FormLabel className="text-slate-300">Dietary Service</FormLabel>
                    <div className="flex gap-4">
                      <div 
                        onClick={() => { if (isVeg && !isNonVeg) return; handleToggle('veg'); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-[11px] rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isVeg ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className={`w-4 h-4 border-[1.5px] rounded-[4px] flex items-center justify-center transition-colors ${isVeg ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`}>
                           {isVeg && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="font-bold text-sm tracking-wide">Veg</span>
                      </div>
                      
                      <div 
                        onClick={() => { if (isNonVeg && !isVeg) return; handleToggle('non-veg'); }}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-[11px] rounded-xl border cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${isNonVeg ? 'bg-rose-500/10 border-rose-500 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                      >
                        <div className={`w-4 h-4 border-[1.5px] rounded-[4px] flex items-center justify-center transition-colors ${isNonVeg ? 'border-rose-500 bg-rose-500' : 'border-slate-600'}`}>
                           {isNonVeg && <Check className="w-3 h-3 text-white stroke-[3]" />}
                        </div>
                        <span className="font-bold text-sm tracking-wide">Non-Veg</span>
                      </div>
                    </div>
                    <FormMessage className="text-red-400" />
                  </FormItem>
                );
              }}
            />

            <FormField
              control={form.control}
              name="isJainAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base text-slate-200">
                      Jain Food Available
                    </FormLabel>
                    <div className="text-sm text-slate-400">
                      Does this outlet serve Jain food?
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="averagePriceForTwo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-slate-300">Average Price for 2 Persons</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500" {...field} className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </FormControl>
                  <FormMessage className="text-red-400" />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
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
            </div>
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
