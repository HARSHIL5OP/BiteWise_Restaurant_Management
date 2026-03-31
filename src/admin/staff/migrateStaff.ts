import { db } from '../../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc, collectionGroup } from 'firebase/firestore';

export const runStaffMigration = async () => {
    console.log("Starting staff migration...");
    try {
        // Fetch all staff members from all restaurant subcollections
        const staffQuery = collectionGroup(db, 'staff');
        const querySnapshot = await getDocs(staffQuery);
        
        console.log(`Found ${querySnapshot.size} staff documents to migrate.`);
        let migratedCount = 0;

        for (const staffDoc of querySnapshot.docs) {
            const data = staffDoc.data();
            const staffId = staffDoc.id;

            // Optional: skip if it's already in the top-level collection
            // In Firestore, collectionGroup queries from all collections named "staff".
            // We can check if its parent is "restaurants" to ensure we're getting subcollections.
            const parentCollection = staffDoc.ref.parent;
            if (parentCollection.parent) {
                // This means it has a parent document (e.g. restaurants/{restaurantId}/staff)
                console.log(`Migrating staff ${staffId}...`);

                // 1. Write to top-level staff collection
                await setDoc(doc(db, 'staff', staffId), data);

                // 2. Delete from original subcollection
                await deleteDoc(staffDoc.ref);
                
                migratedCount++;
            }
        }

        console.log(`Migration complete! Successfully moved ${migratedCount} staff members.`);
    } catch (error) {
        console.error("Migration failed:", error);
    }
};
