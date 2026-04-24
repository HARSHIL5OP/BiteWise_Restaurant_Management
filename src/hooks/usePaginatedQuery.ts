import { useState, useEffect, useCallback } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, startAfter, getDocs, QueryConstraint } from 'firebase/firestore';

export function usePaginatedQuery<T>(
    pathSegments: string[], // e.g., ['restaurants', restaurantId, 'orders']
    baseConstraints: QueryConstraint[] = [], // e.g., orderBy, where
    pageSize: number = 10
) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<any>(null);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchInitial = useCallback(async () => {
        if (pathSegments.some(seg => !seg)) return; // Don't fetch if path is incomplete (e.g. missing restaurantId)

        setLoading(true);
        setError(null);
        try {
            const colRef = collection(db, pathSegments[0], ...pathSegments.slice(1));
            const q = query(colRef, ...baseConstraints, limit(pageSize));
            const snapshot = await getDocs(q);

            const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
            
            setItems(fetchedItems);
            
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === pageSize);
            } else {
                setHasMore(false);
            }
        } catch (err: any) {
            console.error("Error fetching initial paginated data:", err);
            setError(err.message || "Failed to fetch data");
        } finally {
            setLoading(false);
        }
    }, [pathSegments.join('/'), JSON.stringify(baseConstraints), pageSize]);

    const loadMore = useCallback(async () => {
        if (!hasMore || !lastDoc || loadingMore) return;
        
        setLoadingMore(true);
        setError(null);
        try {
            const colRef = collection(db, pathSegments[0], ...pathSegments.slice(1));
            const q = query(colRef, ...baseConstraints, startAfter(lastDoc), limit(pageSize));
            const snapshot = await getDocs(q);

            const newItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as T[];
            
            setItems(prevItems => {
                // Ensure no duplicates by ID (rare but possible with concurrent modifications)
                const existingIds = new Set(prevItems.map((i: any) => i.id));
                const filteredNewItems = newItems.filter((i: any) => !existingIds.has(i.id));
                return [...prevItems, ...filteredNewItems];
            });
            
            if (snapshot.docs.length > 0) {
                setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
                setHasMore(snapshot.docs.length === pageSize);
            } else {
                setHasMore(false);
            }
        } catch (err: any) {
            console.error("Error loading more data:", err);
            setError(err.message || "Failed to load more data");
        } finally {
            setLoadingMore(false);
        }
    }, [hasMore, lastDoc, loadingMore, pathSegments.join('/'), JSON.stringify(baseConstraints), pageSize]);

    useEffect(() => {
        fetchInitial();
    }, [fetchInitial]);

    return { items, setItems, loading, loadingMore, hasMore, loadMore, refetch: fetchInitial, error };
}
