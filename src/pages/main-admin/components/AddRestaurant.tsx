import { useState } from "react";
import { CheckCircle2, ChevronRight, UploadCloud, Store, MapPin, DollarSign, User } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AddRestaurant() {
  const [step, setStep] = useState(1);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Add New Restaurant</h1>
        <p className="text-slate-400">Onboard a new restaurant partner to the platform.</p>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-800 rounded-full z-0"></div>
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-500" style={{ width: `${((step - 1) / 2) * 100}%` }}></div>
        
        {[1, 2, 3].map((s) => (
          <div key={s} className="relative z-10 flex flex-col items-center gap-2">
            <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-sm bg-[#0A0F1C] transition-all duration-300 ${
              step > s ? "border-orange-500 text-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.4)]" 
              : step === s ? "border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.5)]"
              : "border-slate-800 text-slate-600"
            }`}>
              {step > s ? <CheckCircle2 className="w-5 h-5 text-orange-500" /> : s}
            </div>
            <span className={`text-xs font-medium uppercase tracking-wider ${step >= s ? "text-orange-400" : "text-slate-600"}`}>
              {s === 1 ? "Basic Info" : s === 2 ? "Configuration" : "Review"}
            </span>
          </div>
        ))}
      </div>

      <Card className="bg-[#0F172A] border-slate-800 shadow-2xl overflow-hidden relative">
        {/* Decorative elements */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <CardContent className="p-8 relative z-10">
          <form className="space-y-8">
            <div className={`grid gap-6 md:grid-cols-2 ${step === 1 ? 'block' : 'hidden'}`}>
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><Store className="w-5 h-5 text-orange-500" /> Restaurant Details</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Restaurant Name</label>
                  <Input placeholder="e.g. The Spicy Kitchen" className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Cuisine Type</label>
                  <Select>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                      <SelectValue placeholder="Select cuisine type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                      <SelectItem value="italian">Italian</SelectItem>
                      <SelectItem value="indian">Indian</SelectItem>
                      <SelectItem value="chinese">Chinese</SelectItem>
                      <SelectItem value="mexican">Mexican</SelectItem>
                      <SelectItem value="american">American</SelectItem>
                      <SelectItem value="multi">Multi-cuisine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Location Map Link</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input placeholder="Google Maps URL" className="pl-9 bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2"><User className="w-5 h-5 text-blue-500" /> Owner Information</h3>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Owner Name</label>
                  <Input placeholder="John Doe" className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Contact Email</label>
                  <Input type="email" placeholder="owner@restaurant.com" className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Initial Status</label>
                  <Select>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                      <SelectItem value="pending">Pending Approval</SelectItem>
                      <SelectItem value="approved">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className={`space-y-6 ${step === 2 ? 'block' : 'hidden'}`}>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-500" /> Financial & Documents</h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Price Range</label>
                  <Select>
                    <SelectTrigger className="bg-slate-900 border-slate-800 text-slate-200 focus:ring-orange-500/50">
                      <SelectValue placeholder="Select price bracket" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-950 border-slate-800 text-slate-300">
                      <SelectItem value="1">$ - Budget</SelectItem>
                      <SelectItem value="2">$$ - Moderate</SelectItem>
                      <SelectItem value="3">$$$ - Expensive</SelectItem>
                      <SelectItem value="4">$$$$ - Fine Dining</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Commission Rate (%)</label>
                  <Input type="number" defaultValue="15" className="bg-slate-900 border-slate-800 text-slate-200 focus-visible:ring-orange-500/50" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Upload Business License</label>
                <div className="border-2 border-dashed border-slate-800 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-slate-900/50 hover:bg-slate-900 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center group-hover:bg-slate-700 transition-colors">
                    <UploadCloud className="w-6 h-6 text-slate-400 group-hover:text-amber-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500">PDF, JPG or PNG (max. 10MB)</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`space-y-6 ${step === 3 ? 'block' : 'hidden'}`}>
              <div className="text-center space-y-2 py-8">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-4 border border-orange-500/20 shadow-[0_0_30px_rgba(249,115,22,0.2)]">
                  <CheckCircle2 className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold text-white">Ready to Onboard</h3>
                <p className="text-slate-400 max-w-md mx-auto">Please review the details before finalizing. An email notification will be sent to the owner.</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 mt-8 border-t border-slate-800">
              <Button type="button" variant="ghost" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="text-slate-400 hover:text-white">
                Back
              </Button>
              <Button type="button" className={`shadow-[0_0_20px_rgba(249,115,22,0.4)] ${step === 3 ? "bg-emerald-500 hover:bg-emerald-600 border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)] text-white" : "bg-orange-500 hover:bg-orange-600 text-white"}`} onClick={() => setStep(Math.min(3, step + 1))}>
                {step === 3 ? "Create Account" : "Next Step"}
                {step !== 3 && <ChevronRight className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
