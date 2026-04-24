import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, doc, addDoc, serverTimestamp, getDoc, onSnapshot, query, where, orderBy, getDocs, writeBatch } from "firebase/firestore";
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
  const [slots, setSlots] = useState<any[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(true);
  
  // Booking States
  const [selectedGuests, setSelectedGuests] = useState(2);
  const [selectedDate, setSelectedDate] = useState(0); // Index from 0-6
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingOption, setBookingOption] = useState<'exclusive' | 'regular'>('exclusive');
  const [activeCategory, setActiveCategory] = useState<'breakfast' | 'lunch' | 'dinner'>('lunch');
  
  const dates = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

  // Helper for 12h time format
  const formatTime12h = (time24: string) => {
    const [h, m] = time24.split(':');
    let hours = parseInt(h, 10);
    const suffix = hours >= 12 ? 'PM' : 'AM';
    if (hours === 0) hours = 12;
    if (hours > 12) hours -= 12;
    return `${hours.toString().padStart(2, '0')}:${m} ${suffix}`;
  };

  // Find the currently selected slot object
  const selectedSlot = slots.find(s => s.id === selectedSlotId);

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

  // Real-time slots fetching
  useEffect(() => {
    if (!id) return;

    const q = query(
      collection(db, "restaurants", id, "slots"),
      where("isActive", "==", true)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedSlots = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          availableSeats: doc.data().maxCapacity
        }))
        .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)); // Sort in-memory
      
      setSlots(fetchedSlots);
      setIsLoadingSlots(false);
    }, (error) => {
      console.error("Error fetching slots:", error);
      setIsLoadingSlots(false);
    });

    return () => unsubscribe();
  }, [id]);

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
      const reservationDateStr = format(dates[selectedDate], 'yyyy-MM-dd');

      // 1. Fetch available tables
      const tablesRef = collection(db, "restaurants", id as string, "tables");
      const tablesSnap = await getDocs(tablesRef);
      const allTables = tablesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

      // 2. Fetch existing reservations for the same date and slot to find conflicts
      const reservationsRef = collection(db, "reservations");
      const reservationsQuery = query(
        reservationsRef,
        where("restaurantId", "==", id),
        where("reservationDate", "==", reservationDateStr),
        where("slotId", "==", selectedSlot.id),
        where("status", "==", "confirmed")
      );
      const resSnap = await getDocs(reservationsQuery);

      const bookedTableIds = new Set<string>();
      resSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.tableIds && Array.isArray(data.tableIds)) {
              data.tableIds.forEach((tId: string) => bookedTableIds.add(tId));
          }
      });

      // Filter out tables that are booked
      const availableTables = allTables.filter(t => !bookedTableIds.has(t.id));

      // 3. Optimal Allocation Logic
      const allocateTables = (partySize: number, tables: any[]) => {
          // Step 1: Try single table
          const validSingleTables = tables.filter(t => t.capacity >= partySize);
          if (validSingleTables.length > 0) {
              validSingleTables.sort((a, b) => a.capacity - b.capacity);
              return { tableIds: [validSingleTables[0].id], totalAllocatedCapacity: validSingleTables[0].capacity };
          }

          // Step 2 & 3: Combine with optimization (Minimize waste -> Fewer tables)
          let bestCombination: any[] = [];
          let bestCapacity = Infinity;

          // Fail early if restaurant doesn't have enough total free capacity
          const totalAvailableCap = tables.reduce((sum, t) => sum + t.capacity, 0);
          if (totalAvailableCap < partySize) return null;

          // Recursive search with pruning
          const search = (index: number, currentCombo: any[], currentCap: number) => {
              if (currentCap >= partySize) {
                  // Optimization rules: minimize capacity (waste), then minimize number of tables
                  if (currentCap < bestCapacity || (currentCap === bestCapacity && currentCombo.length < bestCombination.length)) {
                      bestCapacity = currentCap;
                      bestCombination = [...currentCombo];
                  }
                  return;
              }
              
              if (index >= tables.length) return;
              
              // Prune if remaining tables can't meet the target
              let remainingCap = 0;
              for(let i = index; i < tables.length; i++) remainingCap += tables[i].capacity;
              if (currentCap + remainingCap < partySize) return;

              // Include table
              currentCombo.push(tables[index]);
              search(index + 1, currentCombo, currentCap + tables[index].capacity);
              currentCombo.pop();

              // Exclude table
              search(index + 1, currentCombo, currentCap);
          };

          // Sort descending for faster large capacity filling
          tables.sort((a, b) => b.capacity - a.capacity);
          
          // Limit combinatorics to Top 20 tables max to prevent browser freeze
          const searchTables = tables.slice(0, 20); 
          const slicedCap = searchTables.reduce((s, t) => s + t.capacity, 0);
          
          if (slicedCap >= partySize) {
              search(0, [], 0);
          } else {
             // Fallback greedy approach if it requires a huge amount of tables
             let fallbackCap = 0;
             let combo = [];
             for(const t of tables) {
                 combo.push(t);
                 fallbackCap += t.capacity;
                 if (fallbackCap >= partySize) break;
             }
             bestCombination = combo;
             bestCapacity = fallbackCap;
          }

          if (bestCombination.length > 0) {
              return { tableIds: bestCombination.map(t => t.id), totalAllocatedCapacity: bestCapacity };
          }

          return null; 
      };

      const allocation = allocateTables(selectedGuests, availableTables);

      if (!allocation) {
          toast.error("Sorry, not enough tables available for this time slot.");
          return;
      }

      const currentPrice = selectedSlot.pricePerGuest;
      const totalAmount = selectedGuests * currentPrice;
      
      const reservationData = {
        restaurantId: id,
        customerId: user.uid,
        reservationDate: reservationDateStr,
        reservationTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        slotId: selectedSlot.id,
        category: selectedSlot.category,
        partySize: selectedGuests,
        bookingOption: bookingOption,
        pricePerGuest: currentPrice,
        discountPercent: selectedSlot.discountPercent,
        totalAmount: bookingOption === 'exclusive' ? totalAmount : 0,
        status: "confirmed",
        tableIds: allocation.tableIds, // Auto-allocated
        totalAllocatedCapacity: allocation.totalAllocatedCapacity, // Auto-allocated
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const reservationRef = await addDoc(collection(db, "reservations"), reservationData);
      
      // Update table statuses using a batch write
      const batch = writeBatch(db);
      allocation.tableIds.forEach((tableId) => {
          const tableRef = doc(db, "restaurants", id as string, "tables", tableId);
          batch.update(tableRef, {
              status: "reserved",
              reservedFor: reservationRef.id,
              reservedDate: reservationDateStr,
              reservedTime: selectedSlot.startTime
          });
      });
      await batch.commit();
      
      toast.success(`Booking confirmed! Allocated capacity for ${allocation.totalAllocatedCapacity} guests.`);
      navigate(`/customer/restaurant/${id}`);
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to book table");
    }
  };

  if (loading || isLoadingSlots) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-medium text-slate-500">Preparing booking experience...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const currentHourMinute = format(now, 'HH:mm');

  // Filter slots for past times if today is selected
  const validSlots = slots.filter(slot => {
    if (selectedDate === 0) {
      return slot.startTime > currentHourMinute;
    }
    return true; // Future dates show all active slots
  });

  const groupedSlots = {
    breakfast: validSlots.filter(s => s.category === 'breakfast'),
    lunch: validSlots.filter(s => s.category === 'lunch'),
    dinner: validSlots.filter(s => s.category === 'dinner'),
  };

  const totalPrice = selectedGuests * (selectedSlot?.pricePerGuest || 0);

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
                onClick={() => {
                  setSelectedGuests(num);
                  // Reset slot if it doesn't accommodate new guest count
                  if (selectedSlot && num > selectedSlot.availableSeats) {
                    setSelectedSlotId(null);
                  }
                }}
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
                onClick={() => {
                  setSelectedDate(idx);
                  setSelectedSlotId(null);
                }}
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
                   OFFERS LIVE
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Dynamic Time Slot Selection */}
        <section className="space-y-6">
          {validSlots.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-3xl border border-slate-100 shadow-sm">
               <Info className="mx-auto text-slate-300 mb-2" size={32} />
               <p className="text-slate-500 font-medium">No slots available for online booking on this date.</p>
            </div>
          ) : (
             <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden p-3 pt-4">
                {/* Category Toggle */}
                <div className="flex bg-slate-50 p-1.5 rounded-[1.5rem] mb-4">
                   {['breakfast', 'lunch', 'dinner'].map(cat => (
                      <button
                         key={cat}
                         onClick={() => setActiveCategory(cat as any)}
                         className={`flex-1 py-2.5 rounded-2xl text-[11px] sm:text-xs font-bold capitalize transition-all ${
                            activeCategory === cat
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'text-slate-500 hover:text-slate-700'
                         }`}
                      >
                         {cat === 'breakfast' && '☀️ '}
                         {cat === 'lunch' && '🌤️ '}
                         {cat === 'dinner' && '🌙 '}
                         {cat}
                      </button>
                   ))}
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                    {groupedSlots[activeCategory].length > 0 ? (
                        groupedSlots[activeCategory].map((slot: any) => {
                          const isUnavailable = slot.availableSeats <= 0 || selectedGuests > slot.availableSeats;
                          return (
                            <button
                              key={slot.id}
                              disabled={isUnavailable}
                              onClick={() => setSelectedSlotId(slot.id)}
                              className={`py-2.5 rounded-xl border-2 flex flex-col items-center justify-center transition-all ${
                                  selectedSlotId === slot.id 
                                  ? 'bg-orange-500/5 border-orange-500 ring-2 ring-orange-500/10' 
                                  : isUnavailable ? 'bg-slate-50 border-slate-50 opacity-40 cursor-not-allowed' : 'bg-white border-slate-50'
                              }`}
                            >
                                <span className={`text-[10px] font-bold leading-none ${selectedSlotId === slot.id ? 'text-orange-600' : 'text-slate-800'}`}>
                                    {formatTime12h(slot.startTime)}
                                </span>
                                {slot.discountPercent > 0 && (
                                    <span className={`text-[8px] font-bold ${selectedSlotId === slot.id ? 'text-orange-400' : 'text-emerald-500'} mt-0.5`}>
                                        {slot.discountPercent}% off
                                    </span>
                                )}
                            </button>
                          );
                        })
                    ) : (
                         <div className="col-span-4 text-center py-8 text-slate-400 text-xs font-medium">
                            No {activeCategory} slots available for this date.
                         </div>
                    )}
                 </div>
              </div>
          )}
        </section>

        {/* Booking Option Section */}
        {selectedSlot && (
            <section className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h3 className="text-lg font-bold tracking-tight text-slate-800">Booking option for {formatTime12h(selectedSlot.startTime)}</h3>
                
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
                            <h4 className="text-lg font-black text-slate-800">Flat {selectedSlot.discountPercent}% Off on Total Bill</h4>
                            <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-500 font-medium">Cover charge: <span className="text-slate-800 font-bold">₹{selectedSlot.pricePerGuest}/guest</span></p>
                                <p className="text-[11px] text-emerald-600 font-bold italic">Redeem full amount against final bill payment</p>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">{selectedSlot.availableSeats} seats left</span>
                                <button className="text-[10px] text-blue-500 font-black uppercase tracking-wider flex items-center gap-1">
                                    Slot Details <ChevronRight size={10} strokeWidth={4} />
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
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regular booking</span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${bookingOption === 'regular' ? 'border-orange-500 bg-orange-500' : 'border-slate-300'}`}>
                                {bookingOption === 'regular' && <Check size={12} className="text-white stroke-[4]" />}
                            </div>
                        </div>
                        <h4 className="text-lg font-bold text-slate-700">Standard table reservation</h4>
                        <p className="text-xs text-slate-500 mt-1 font-medium">Cover charge: <span className="text-emerald-600 font-black uppercase">Free</span></p>
                    </div>
                </div>

                {/* Terms accordion (Static) */}
                <div className="pt-4 pb-8 border-t border-slate-100">
                    <button className="w-full flex items-center justify-between py-2">
                        <span className="text-sm font-bold text-slate-800 tracking-tight">Offer terms and conditions</span>
                        <ChevronDown size={18} className="text-slate-400" />
                    </button>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        • Pre-payment of cover charge is mandatory for exclusive offers.<br/>
                        • Exclusive offer cannot be combined with other discounts.<br/>
                        • Reservation is held for 15 mins from the booked time.
                    </p>
                </div>
            </section>
        )}

      </div>

      {/* Dynamic Sticky Bottom */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-100 px-6 py-5 z-50">
        <div className="flex items-center justify-between mb-4">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Payable</p>
                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                   {bookingOption === 'exclusive' ? `₹${totalPrice.toLocaleString()}` : 'FREE'}
                </p>
            </div>
            {(bookingOption === 'exclusive' && selectedSlot) && (
                <div className="text-right">
                    <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Offer Applied</p>
                    <p className="text-lg font-black text-emerald-600 tracking-tighter">FLAT {selectedSlot.discountPercent}% OFF</p>
                </div>
            )}
        </div>
        <button 
          onClick={handleProceed}
          className={`w-full py-4 rounded-2xl text-white font-black text-lg shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 ${
            selectedSlotId ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-slate-300 pointer-events-none'
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


