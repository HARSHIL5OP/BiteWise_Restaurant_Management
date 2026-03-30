import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { collection, getDocs, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import RestaurantFloorBlueprint from "@/components/RestaurantFloorBlueprint";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function CustomerTableView() {
  const { id } = useParams(); // restaurantId
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTables() {
      try {
        const querySnapshot = await getDocs(
          collection(db, "restaurants", id as string, "tables")
        );
        const tablesData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTables(tablesData);
      } catch (error) {
        console.error("Error fetching tables:", error);
      } finally {
        setLoading(false);
      }
    }
    if (id) fetchTables();
  }, [id]);

  const handleBookTable = async (table: any) => {
    if (!user) {
      toast.error("Please login to book a table");
      return;
    }
    
    // Disable if not available
    if (table.status !== "available") {
        toast.error("Table not available");
        return;
    }

    try {
      // 🔥 STEP A: CREATE RESERVATION
      await addDoc(collection(db, "reservations"), {
        restaurantId: id,
        customerId: user.uid,
        tableId: table.tableId || table.id,
        reservationTime: new Date(), 
        partySize: table.capacity,
        notes: "",
        status: "confirmed",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 🔥 STEP B: UPDATE TABLE STATUS
      const tableRef = doc(
        db,
        "restaurants",
        id as string,
        "tables",
        table.id
      );

      await updateDoc(tableRef, {
        status: "reserved",
        updatedAt: serverTimestamp()
      });

      // 🔥 STEP C: UPDATE UI
      setTables(prev =>
        prev.map(t =>
          t.id === table.id
            ? { ...t, status: "reserved" }
            : t
        )
      );

      // 🔥 SUCCESS FEEDBACK
      toast.success(`Table ${table.tableId || table.id} booked successfully!`);
    } catch (error) {
      console.error("Booking failed:", error);
      toast.error("Failed to book table");
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0A0F1C] min-h-screen text-slate-200 font-sans flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(249,115,22,0.5)] flex items-center justify-center">
            <div className="w-4 h-4 bg-white rounded-full animate-bounce"></div>
          </div>
          <p className="font-medium text-slate-400">Loading live floor plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0A0F1C] min-h-screen text-slate-200 font-sans max-w-md mx-auto relative overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-900">
      
      {/* Header */}
      <div className="p-4 flex items-center gap-4 sticky top-0 z-50 bg-[#0A0F1C]/90 backdrop-blur-md border-b border-slate-900 shadow-sm">
        <button 
          onClick={() => navigate(-1)} 
          className="w-10 h-10 bg-[#0F172A] border border-slate-800 rounded-full flex items-center justify-center text-white hover:bg-slate-800 transition-colors active:scale-95 shadow-md flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">Live Floor Plan</h1>
          <p className="text-xs text-orange-400 font-medium">Select an available table</p>
        </div>
      </div>
      
      {/* Scrollable Blueprint wrapper mapped directly to Mobile-View framing */}
      <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar pb-10 bg-slate-950/50">
        <div className="min-w-[1000px] h-full p-4 transform scale-90 origin-top-left sm:scale-100 sm:p-0">
          <RestaurantFloorBlueprint tables={tables} isCustomerView={true} onBookTable={handleBookTable} />
        </div>
      </div>
    </div>
  );
}
