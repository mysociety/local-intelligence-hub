// page.js
"use client";

import Map from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"


import { BarChart3, Layers, LibraryBig } from "lucide-react"
import { Button } from "@/components/ui/button"




export default function Home() {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    return (
        <main className="-m-20 static">
            <div className="h-dvh">
                <Map
                    mapboxAccessToken={mapboxToken}
                    initialViewState={{
                        longitude: -5.1261105,
                        latitude: 51.73036,
                        zoom: 6
                    }}
                    mapStyle="mapbox://styles/commonknowledge/clqeaydxl00cd01qyhnk70s7s"
                />
            </div>
            <div className="absolute top-10  left-10 right-0">
                <div className="flex">
                    <Card className="p-4 bg-white border-1 border-meepGray-700 text-meepGray-800">
                        <CardHeader>
                            <CardTitle className="text-hMd mb-4">Main List</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-2 items-center mb-2">
                                <Button variant="secondary" className="w-10 h-10 p-3">
                                    <Layers/>
                                </Button>
                                Data configuration
                            </div>
                            <div className="flex gap-2 items-center mb-2">
                                <Button variant="secondary" className="w-10 h-10 p-3">
                                    <BarChart3/>
                                </Button>
                                Constituency data
                            </div>                            
                        </CardContent>

                    </Card>
                </div>
            </div>
        </main>
    );
}

