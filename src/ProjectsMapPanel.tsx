
import type { FeatureCollection } from "geojson"
import type { LineString } from 'geojson'
import type {Feature} from 'geojson'
import type {Point} from 'geojson'
import { useEffect, useRef } from 'react'
import { select } from 'd3-selection'
import { zoom, zoomIdentity } from 'd3-zoom'
import {useState} from 'react'
import ProjectCard from "./ProjectCard"


type ProjectsMapPanelProperties = {
    title: string,
    mapData: FeatureCollection
}

type DomainColors = {
    biological: string,
    urban: string,
    methods: string
}


type NatureColors = {
    method: string,
    concept: string,
    scale: string
}


function MapPanel({title, mapData}: ProjectsMapPanelProperties){
    const SCALE = 3
    const [selectedLandmark, setSelectedLandmark] = useState<Feature<Point> | null> (null);
    const [svgWidth, setSvgWidth] = useState(0)
    const [hoveredIntersection, setHoveredIntersection] = useState<any>(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    const landmarks = mapData.features.filter((feature) => {
        if(feature.properties?.featureType === "landmark"){
            return true;
        }
        return false;
    });

    const streets = mapData.features.filter((feature) =>{
        if(feature.properties?.featureType === "street"){
            return true;
        }
        return false;
    });

    const intersections = mapData.features.filter(
        (feature) =>{
            if(feature.properties?.featureType === "intersection"){
                return true;
            }
            else{
                return false;
            }
        }
    );

    let domColors:DomainColors = {
        biological: "#3fb950",
        urban: "#d29922",
        methods: '#58a6ff'
    }

    const natureColors: NatureColors = {
        method: '#c084fc',
        concept: '#22d3ee',
        scale: '#fb923c'
    }

    const activeStreets = streets.filter((street) => {
    const lm = getStreetLandmark(street as Feature<LineString>)
    return lm?.properties?.status === 'active'
    })

    function getStreetLandmark(street: Feature<LineString>) {
    const coords = (street.geometry as LineString).coordinates
    // Use midpoint of street
    const mid = coords[Math.floor(coords.length / 2)]
    const mx = mid[0]
    const my = mid[1]

    return landmarks.find((lm) => {
        const lmCoords = (lm.geometry as Point).coordinates
        const dist = Math.sqrt(
            Math.pow(mx - lmCoords[0], 2) + Math.pow(my - lmCoords[1], 2)
        )
        return dist <= (lm.properties?.radius ?? 80)
    }) ?? null
    }


    function plotPoint(landmark:Feature<Point>){
        //Get the coordinates of the landmark
        const coords =  landmark.geometry.coordinates;
        //Get its color
        const color = domColors[landmark.properties?.domain as keyof DomainColors] ?? "gray";
        //Radius
        const radius = (landmark.properties?.radius ?? 100)*SCALE;
        let TEXT_WIDTH = 200 * SCALE
        let TEXT_HEIGHT = 100 * SCALE
        const cx = coords[0] * SCALE
        const cy = -coords[1] * SCALE

        return (
        <g key={landmark.properties?.id}
            onClick={() => {
        console.log('clicked', landmark.properties?.name)
        setSelectedLandmark(landmark)
        }} style={{ cursor: 'pointer' }}>
            <circle
                cx={cx}
                cy={cy}
                r={radius}
                fill={color}
                fillOpacity={0.15}
                stroke={color}
                strokeWidth={1.5*SCALE}
            />
            <foreignObject
                x={cx - TEXT_WIDTH/2}
                y={cy + radius + 8}
                width={TEXT_WIDTH}
                height={TEXT_HEIGHT}
            >
                <div style={{
                    color: color,
                    fontSize: `${15 * SCALE}px`,
                    textAlign: 'center',
                    lineHeight: '1.3',
                    wordWrap: 'break-word',
                    fontWeight: "bold"
                }}>
                    {landmark.properties?.name}
                </div>
    </foreignObject>
        </g>
    )
    }

    const svgRef = useRef<SVGSVGElement>(null)
    const gRef = useRef<SVGGElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)


    useEffect(() => {
        if (!svgRef.current || !gRef.current) return

        setSvgWidth(svgRef.current.clientWidth)

        const zoomBehavior = zoom<SVGSVGElement, unknown>()
            .scaleExtent([0.05, 5])
            .filter((event) => !event.button || event.type === 'wheel')
            .on('zoom', (event) => {
                select(gRef.current!).attr('transform', event.transform.toString())
            })

        select(svgRef.current).call(zoomBehavior)
        select(svgRef.current).on('click.zoom', null)

        select(svgRef.current).call(
            zoomBehavior.transform,
            zoomIdentity.translate(300, 600).scale(0.17)
        )

        // Build scaled coords for active streets
        const activeStreetCoords = activeStreets.map(street => 
            (street.geometry as LineString).coordinates.map(([x, y]) => [x * SCALE, -y * SCALE])
        )

        // Create particles — one per active street, staggered
        const particles = activeStreetCoords.map((coords, i) => ({
            coords,
            t: i / activeStreets.length, // stagger start positions
            speed: 0.002,
            color: domColors[activeStreets[i].properties?.domain as keyof DomainColors] ?? 'white'
        }))

        // Get position along polyline given t (0 to 1)
        function getPosOnLine(coords: number[][], t: number) {
            const totalSegments = coords.length - 1
            const scaled = t * totalSegments
            const seg = Math.min(Math.floor(scaled), totalSegments - 1)
            const segT = scaled - seg
            const a = coords[seg]
            const b = coords[seg + 1]
            return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT]
        }

        // Animation loop
        let animId: number
        function animate() {
            const canvas = canvasRef.current
            const svg = svgRef.current
            if (!canvas || !svg) return

            const ctx = canvas.getContext('2d')
            if (!ctx) return

            // Get current D3 transform
            const transform = select(svg).property('__zoom')
            const tx = transform?.x ?? 0
            const ty = transform?.y ?? 0
            const tk = transform?.k ?? 1

            ctx.clearRect(0, 0, canvas.width, canvas.height)

            particles.forEach(p => {
                p.t = (p.t + p.speed) % 1
                const [wx, wy] = getPosOnLine(p.coords, p.t)
                // Apply zoom transform
                const sx = wx * tk + tx
                const sy = wy * tk + ty

                ctx.beginPath()
                ctx.arc(sx, sy, 4, 0, Math.PI * 2)
                ctx.fillStyle = p.color
                ctx.fill()
            })

            animId = requestAnimationFrame(animate)
        }

        animate()

        return () => cancelAnimationFrame(animId)
}, [])



    return(
        <div className="bio-paragraph">
            <h2>{title}</h2>
            <div className="map-instructions">
                <span>🟢 Active projects have animated particles</span>
                <span>Click on a project to see details</span>
                <span>Hover over connections to see commonalities</span>
            </div>
            <div style={{ position: 'relative', width: '100%' }}>
            <svg width="100%" height="800" ref={svgRef} style={{ cursor: 'grab' }}>
                <g ref={gRef}>
                {
                    streets.map((street) => {
                    const coords = (street.geometry as LineString).coordinates
                    const color = domColors[street.properties?.domain as keyof DomainColors] ?? 'gray'

                    return (
                        <polyline
                            key={street.properties?.streetId}
                            points={coords.map(([x, y]) => `${x * SCALE},${-y * SCALE}`).join(' ')}
                            stroke={color}
                            fill="none"
                            strokeWidth="5"
                        />
                    )
                })
                }
                {intersections.map((intersection) => {
                    const coords = (intersection.geometry as LineString).coordinates
                    const color = natureColors[intersection.properties?.nature as keyof NatureColors] ?? 'white'
                    return (
                        <g key={intersection.properties?.id}>
                            <polyline
                                points={coords.map(([x, y]) => `${x * SCALE},${-y * SCALE}`).join(' ')}
                                stroke={color}
                                fill="none"
                                strokeWidth={4*SCALE}
                                strokeDasharray="12 6"
                            />
                            <polyline
                                points={coords.map(([x, y]) => `${x * SCALE},${-y * SCALE}`).join(' ')}
                                stroke="transparent"
                                fill="none"
                                strokeWidth={20 * SCALE}
                                onMouseEnter={(e) => {
                                    setHoveredIntersection(intersection.properties)
                                    setTooltipPos({ x: e.clientX, y: e.clientY })
                                }}
                                onMouseLeave={() => setHoveredIntersection(null)}
                            />
                        </g>
                    )
                })}
                {
                    (landmarks as Feature<Point>[]).map(plotPoint)
                }

                </g>
            </svg>
            <canvas
                ref={canvasRef}
                width={svgWidth}
                height={800}
                style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
            />
            </div>
            {selectedLandmark && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    zIndex: 1000,
                    width: '300px'
                }}>
                    <ProjectCard
                        name={selectedLandmark.properties?.name}
                        description={selectedLandmark.properties?.description}
                        domain={selectedLandmark.properties?.domain}
                        scale={selectedLandmark.properties?.scale}
                        status={selectedLandmark.properties?.status}
                        onClose={()=>setSelectedLandmark(null)}
                    />
                </div>
            )}
            {hoveredIntersection && (
            <div style={{
                position: 'fixed',
                left: tooltipPos.x + 12,
                top: tooltipPos.y + 12,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '10px 14px',
                zIndex: 2000,
                maxWidth: '220px',
                pointerEvents: 'none'
            }}>
                <div style={{ color: 'var(--text-h)', fontWeight: 'bold', marginBottom: '4px' }}>
                    {hoveredIntersection.label}
                </div>
                <div style={{ color: 'var(--accent)', fontSize: '12px', marginBottom: '6px' }}>
                    {hoveredIntersection.nature}
                </div>
                <div style={{ color: 'var(--text)', fontSize: '13px' }}>
                    {hoveredIntersection.description}
                </div>
            </div>
)}
        </div>
    )

}

export default MapPanel

