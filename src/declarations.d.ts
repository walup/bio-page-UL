declare module '*.geojson'{
    import {FeatureCollection} from 'geojson'
    const value: FeatureCollection
    export default value
}


declare module '*.md?raw' {
    const content: string
    export default content
}