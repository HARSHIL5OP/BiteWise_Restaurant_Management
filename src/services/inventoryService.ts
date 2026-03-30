import { db } from '../lib/firebase';
import {
    collection, doc, getDocs, addDoc, updateDoc, setDoc, serverTimestamp, Timestamp
} from 'firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export type InventoryUnit = 'kg' | 'g' | 'l' | 'ml' | 'pcs';

export interface InventoryItem {
    id?: string;
    restaurantId: string;
    name: string;
    quantity: number;
    unit: InventoryUnit;
    threshold: number;
    supplier: string;
    costPerUnit: number;
    lastRestocked: string;
    updatedAt: string;
}

export interface IngredientEntry {
    inventoryId: string;
    name: string;
    quantityUsed: number;
    unit: InventoryUnit;
    deductOnOrder: boolean;
}

// ─── Validation ───────────────────────────────────────────────────────────────

const VALID_UNITS: InventoryUnit[] = ['kg', 'g', 'l', 'ml', 'pcs'];

function validateUnit(unit: string): asserts unit is InventoryUnit {
    if (!VALID_UNITS.includes(unit as InventoryUnit)) {
        throw new Error(`Invalid unit "${unit}". Must be one of: ${VALID_UNITS.join(', ')}`);
    }
}

function validateQuantity(qty: number) {
    if (qty < 0) throw new Error('Quantity must not be negative.');
}

// ─── A. Add Inventory Item ────────────────────────────────────────────────────

export async function addInventoryItem(
    restaurantId: string,
    data: Omit<InventoryItem, 'id' | 'restaurantId' | 'updatedAt' | 'lastRestocked'>
): Promise<string> {
    validateUnit(data.unit);
    validateQuantity(data.quantity);

    const now = new Date().toISOString();

    const itemRef = doc(collection(db, 'restaurants', restaurantId, 'inventory'));
    const payload: InventoryItem = {
        restaurantId,
        name: data.name.trim(),
        quantity: data.quantity,
        unit: data.unit,
        threshold: data.threshold,
        supplier: data.supplier.trim(),
        costPerUnit: data.costPerUnit,
        lastRestocked: now,
        updatedAt: now,
    };

    await setDoc(itemRef, payload);
    return itemRef.id;
}

// ─── B. Read Inventory ────────────────────────────────────────────────────────

export async function getInventoryItems(restaurantId: string): Promise<InventoryItem[]> {
    const snap = await getDocs(collection(db, 'restaurants', restaurantId, 'inventory'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InventoryItem));
}

// ─── C. Update / Restock Inventory ───────────────────────────────────────────

/**
 * General update: only quantity, supplier, costPerUnit are permitted.
 */
export async function updateInventoryItem(
    restaurantId: string,
    inventoryId: string,
    changes: Partial<Pick<InventoryItem, 'quantity' | 'supplier' | 'costPerUnit'>>
): Promise<void> {
    if (changes.quantity !== undefined) validateQuantity(changes.quantity);

    const itemRef = doc(db, 'restaurants', restaurantId, 'inventory', inventoryId);
    await updateDoc(itemRef, {
        ...changes,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Restock: increases quantity, updates lastRestocked + updatedAt.
 */
export async function restockInventoryItem(
    restaurantId: string,
    inventoryId: string,
    currentQuantity: number,
    addQty: number
): Promise<void> {
    if (addQty <= 0) throw new Error('Restock quantity must be positive.');

    const newQty = currentQuantity + addQty;
    const now = new Date().toISOString();

    const itemRef = doc(db, 'restaurants', restaurantId, 'inventory', inventoryId);
    await updateDoc(itemRef, {
        quantity: newQty,
        lastRestocked: now,
        updatedAt: now,
    });
}

// ─── D. Add Ingredients to Menu Item ─────────────────────────────────────────

export async function saveMenuIngredients(
    restaurantId: string,
    menuItemId: string,
    ingredients: IngredientEntry[]
): Promise<void> {
    for (const ing of ingredients) {
        validateUnit(ing.unit);
        if (ing.quantityUsed <= 0) throw new Error(`quantityUsed for "${ing.name}" must be positive.`);

        const ingRef = doc(collection(db, 'restaurants', restaurantId, 'menu', menuItemId, 'ingredients'));
        const payload: IngredientEntry = {
            inventoryId: ing.inventoryId,
            name: ing.name,
            quantityUsed: ing.quantityUsed,
            unit: ing.unit,
            deductOnOrder: true,
        };
        await setDoc(ingRef, payload);
    }
}
