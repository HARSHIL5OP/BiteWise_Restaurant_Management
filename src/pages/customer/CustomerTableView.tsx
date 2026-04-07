import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, doc, addDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft, Users, Calendar, Clock, 
  CheckCircle2, Info, ChevronRight, 
  Tag, Percent, Star, ChevronDown, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { format, addDays, isToday, isTomorrow } from "date-fns";

export default function CustomerTableView() {
  const { id } = useParams(); // restaurantId
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [restaurant, setRestaurant] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Booking States
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(0); // Index from 0-6
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [bookingOption, setBookingOption] = useState<'exclusive' | 'regular'>('exclusive');
  
  const coverChargePerGuest = 25;
  const offerPercentage = 30;

  useEffect(() => {
    async function fetchRestaurant() {
      try {
        const docRef = doc(db, "restaurants", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setRestaurant({ id: docSnap.id, ...docSnap.data() });
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchRestaurant();
  }, [id]);

  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));
  
  const lunchSlots = ["12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM"];
  const dinnerSlots = ["07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"];

  const handleProceed = async () => {
    if (!user) {
      toast.error("Please login to book a table");
      return;
    }
    
    if (!selectedSlot) {
      toast.error("Please select a time slot");
      return;
    }

    try {
      const totalCoverCharge = selectedGuests * coverChargePerGuest;
      
      const reservationData = {
        restaurantId: id,
        customerId: user.uid,
        reservationDate: format(dates[selectedDate], 'yyyy-MM-dd'),
        reservationTime: selectedSlot,
        partySize: selectedGuests,
        bookingOption: bookingOption,
        totalAmount: bookingOption === 'exclusive' ? totalCoverCharge : 0,
        status: "confirmed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, "reservations"), reservationData);
      
      toast.success(`Booking confirmed for ${selectedGuests} guests at ${selectedSlot}!`);
      navigate(`/customer/restaurant/${id}`);
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to book table");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-slate-500">Preparing booking experience...</p>
        </div>
      </div>
    );
  }

  const totalPrice = selectedGuests * coverChargePerGuest;

  return (
    <div className="bg-[#FAF9F6] min-h-screen text-slate-900 font-sans max-w-md mx-auto relative flex flex-col shadow-2xl border-x border-slate-200 overflow-x-hidden pb-32">
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-600 active:scale-90 transition-transform">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-bold leading-tight">Book table</h1>
          <p className="text-xs text-slate-500 font-medium">{restaurant?.name || "Restaurant"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 space-y-8">
        
        {/* DineCash Banner */}
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center gap-2">
            <div className="bg-emerald-500 rounded-full p-1">
                <Check className="w-3 h-3 text-white stroke-[4]" />
            </div>
            <p className="text-[11px] font-bold text-emerald-800 tracking-tight">
                Get flat 10% DineCash on your bill payment
            </p>
        </div>

        {/* Guest Selection */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-slate-800">Number of guest(s)</h3>
          <div className="flex overflow-x-auto no-scrollbar gap-2.5 py-1">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
              <button
                key={num}
                onClick={() => setSelectedGuests(num)}
                className={`min-w-[60px] h-[48px] rounded-xl flex items-center justify-center font-bold text-lg border-2 transition-all shadow-sm ${
                  selectedGuests === num 
                  ? 'bg-orange-500/5 border-orange-500 text-orange-600 ring-2 ring-orange-500/10' 
                  : 'bg-white border-slate-100 text-slate-500'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </section>

        {/* Date Selection */}
        <section className="space-y-4">
          <h3 className="text-lg font-bold tracking-tight text-slate-800">When are you visiting?</h3>
          <div className="flex overflow-x-auto no-scrollbar gap-3 py-1">
            {dates.map((date, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedDate(idx)}
                className={`min-w-[85px] p-3 rounded-2xl flex flex-col items-center border-2 transition-all shadow-sm relative ${
                  selectedDate === idx 
                  ? 'bg-orange-500/5 border-orange-500 ring-2 ring-orange-500/10' 
                  : 'bg-white border-slate-100'
                }`}
              >
                <span className={`text-base font-bold ${selectedDate === idx ? 'text-orange-600' : 'text-slate-800'}`}>
                    {format(date, 'dd')}
                </span>
                <span className={`text-xs font-semibold ${selectedDate === idx ? 'text-orange-500' : 'text-slate-500'}`}>
                    {isToday(date) ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, 'EEE')}
                </span>
                <div className="mt-2 bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                    {offerPercentage}% OFF
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Time Slot Selection */}
        <section className="space-y-4">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
             {/* Section Tabs */}
             <div className="p-4 border-b border-slate-50">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <Clock size={16} className="text-slate-400" />
                    <span>Dinner</span>
                </div>
             </div>

             <div className="p-4 grid grid-cols-4 gap-2.5">
                {dinnerSlots.map(slot => (
                    <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                            selectedSlot === slot 
                            ? 'bg-orange-500/5 border-orange-500 ring-2 ring-orange-500/10' 
                            : 'bg-slate-50 border-transparent'
                        }`}
                    >
                        <span className={`text-[10px] font-bold leading-none ${selectedSlot === slot ? 'text-orange-600' : 'text-slate-800'}`}>{slot}</span>
                        <span className={`text-[8px] font-bold ${selectedSlot === slot ? 'text-orange-400' : 'text-slate-400'} mt-0.5`}>{offerPercentage}% off</span>
                    </button>
                ))}
             </div>
          </div>
        </section>

        {/* Booking Option Section */}
        {selectedSlot && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold tracking-tight text-slate-800">Booking option for {selectedSlot}</h3>
                
                <div className="space-y-3">
                    {/* Option 1: Exclusive */}
                    <div 
                        onClick={() => setBookingOption('exclusive')}
                        className={`relative p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer ${
                            bookingOption === 'exclusive' 
                            ? 'bg-white border-orange-500 ring-4 ring-orange-500/10' 
                            : 'bg-white border-slate-100 grayscale-[0.8] opacity-80'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <span className="bg-orange-100 text-orange-600 p-1 rounded-md">
                                    <Percent size={12} strokeWidth={4} />
                                </span>
                                <span className="text-xs font-black text-rose-500 uppercase tracking-widest italic">Exclusive</span>
                            </div>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${bookingOption === 'exclusive' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                                {bookingOption === 'exclusive' && <Check size={12} className="text-white stroke-[4]" />}
                            </div>
                        </div>

                        <div>
                            <h4 className="text-lg font-black text-slate-800">Flat {offerPercentage}% Off on Total Bill</h4>
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Redeemable cover charge: <span className="text-slate-800 font-bold">₹{coverChargePerGuest}/guest</span></p>
                                <p className="text-[11px] text-emerald-600 font-bold">Redeem it by paying final bill via BiteWise</p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">2 seats left</span>
                                <button className="text-[10px] text-blue-500 font-black uppercase tracking-wider flex items-center gap-1">
                                    View benefits <ChevronRight size={10} strokeWidth={4} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Option 2: Regular */}
                    <div 
                        onClick={() => setBookingOption('regular')}
                        className={`p-5 rounded-[1.5rem] border-2 transition-all cursor-pointer ${
                            bookingOption === 'regular' 
                            ? 'bg-white border-orange-500 ring-4 ring-orange-500/10' 
                            : 'bg-white border-slate-100 grayscale-[0.8] opacity-80'
                        }`}
                    >
                         <div className="flex items-center justify-between mb-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regular Offer</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${bookingOption === 'regular' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                                {bookingOption === 'regular' && <Check size={12} className="text-white stroke-[4]" />}
                            </div>
                        </div>
                        <h4 className="text-lg font-bold text-slate-700">Standard table booking</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Cover charge: <span className="text-emerald-600 font-black uppercase">Free</span></p>
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 font-medium text-center px-4 leading-relaxed">
                    Coupons & additional offers available during bill payment
                </p>

                {/* Terms accordion (Static) */}
                <div className="pt-4 pb-8 border-t border-slate-100">
                    <button className="w-full flex items-center justify-between py-2">
                        <span className="text-sm font-bold text-slate-800 tracking-tight">Offer terms and conditions</span>
                        <ChevronDown size={18} className="text-slate-400" />
                    </button>
                </div>
            </section>
        )}

      </div>

      {/* Sticky Bottom Proceed Button */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-6 py-5 z-50">
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payable</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                   {bookingOption === 'exclusive' ? `₹${totalPrice.toLocaleString()}` : 'FREE'}
                </p>
            </div>
            {bookingOption === 'exclusive' && (
                <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Savings</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tighter">Flat {offerPercentage}% OFF</p>
                </div>
            )}
        </div>
        <button 
          onClick={handleProceed}
          className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            selectedSlot ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 pointer-events-none'
          }`}
        >
          Proceed
        </button>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>

    </div>
  );
}

