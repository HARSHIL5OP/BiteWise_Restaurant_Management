import AddRestaurantForm from "@/components/forms/AddRestaurantForm";

export default function AddRestaurantPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Add New Restaurant</h1>
        <p className="text-slate-400">Onboard a new restaurant partner to the platform and sync with Firebase.</p>
      </div>

      <div className="mt-8">
        <AddRestaurantForm />
      </div>
    </div>
  );
}
