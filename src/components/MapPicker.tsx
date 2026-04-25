import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Loader2 } from 'lucide-react';

// Fix for default marker icon in react-leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface MapPickerProps {
    lat: number;
    lng: number;
    onChange: (lat: number, lng: number, address: string) => void;
}

const MapEventsListener = ({ onClick }: { onClick: (lat: number, lng: number) => void }) => {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
};


export const MapPicker: React.FC<MapPickerProps> = ({ lat, lng, onChange }) => {
    const defaultLat = 23.0225;
    const defaultLng = 72.5714;
    
    const [position, setPosition] = useState<[number, number]>([
        lat || defaultLat,
        lng || defaultLng
    ]);
    const [loading, setLoading] = useState(false);
    const [currentAddress, setCurrentAddress] = useState('');
    const markerRef = useRef<L.Marker>(null);

    // Initial address fetch if lat/lng are provided
    useEffect(() => {
        if (lat && lng && lat !== 0 && lng !== 0) {
            setPosition([lat, lng]);
            reverseGeocode(lat, lng, false);
        }
    }, []);

    const reverseGeocode = async (lat: number, lng: number, shouldOnChange: boolean = true) => {
        setLoading(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await response.json();
            if (data && data.display_name) {
                setCurrentAddress(data.display_name);
                if (shouldOnChange) {
                    onChange(lat, lng, data.display_name);
                }
            } else if (shouldOnChange) {
                onChange(lat, lng, '');
            }
        } catch (error) {
            console.error('Error fetching address:', error);
            if (shouldOnChange) {
                onChange(lat, lng, '');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = () => {
        const marker = markerRef.current;
        if (marker != null) {
            const newPos = marker.getLatLng();
            setPosition([newPos.lat, newPos.lng]);
            reverseGeocode(newPos.lat, newPos.lng);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2 justify-between">
                <label className="text-sm font-medium text-slate-500 dark:text-slate-400">Select Location on Map</label>
                {loading && (
                    <span className="flex items-center gap-1 text-xs text-indigo-500 font-medium">
                        <Loader2 size={12} className="animate-spin" /> Fetching address...
                    </span>
                )}
            </div>
            
            <div className="h-[300px] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 relative z-0">
                <MapContainer 
                    center={position} 
                    zoom={13} 
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&amp;copy; &lt;a href="https://www.openstreetmap.org/copyright"&gt;OpenStreetMap&lt;/a&gt; contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <MapEventsListener onClick={(lat, lng) => {
                        setPosition([lat, lng]);
                        reverseGeocode(lat, lng);
                    }} />
                    {position !== null && (
                        <Marker
                            draggable={true}
                            eventHandlers={{
                                dragend: handleDragEnd,
                            }}
                            position={position}
                            ref={markerRef}
                        />
                    )}
                </MapContainer>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex gap-3">
                <MapPin size={18} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 w-full">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-2">
                        {currentAddress || "Click on the map or drag the marker to select a location"}
                    </p>
                    <div className="flex gap-4 text-xs text-slate-500 font-mono">
                        <span>Lat: {position[0].toFixed(6)}</span>
                        <span>Lng: {position[1].toFixed(6)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
