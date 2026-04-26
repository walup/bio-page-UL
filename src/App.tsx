import { useState } from 'react'
import BioParagraph from './BioParagraph'
import './App.css'
import bioContent from "/Users/legariapena.j/Documents/biopage-mockup/bio-page/my-app/data/bio.md?raw"
import MapPanel from './ProjectsMapPanel'
import mapData from '../data/map.json'
import note1 from '../data/dispatches/Note_1_Illustration.md?raw'
import dispatchIndex from '../data/dispatches.json'
import Dispatches from './Dispatches'


function App() {
  const dispatchFiles: Record<string, string> = {
    'dispatches/Note_1_Illustration.md': note1
  }

  function parseFrontmatter(raw: string) {
    const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) return { data: {}, content: raw }
    
    const frontmatter = match[1]
    const content = match[2]
    
    const data: Record<string, string> = {}
    frontmatter.split('\n').forEach(line => {
        const [key, ...rest] = line.split(':')
        if (key && rest.length) data[key.trim()] = rest.join(':').trim()
    })
    
    return { data, content }
  }

  const dispatches = dispatchIndex.map((d) => {
      const { content } = parseFrontmatter(dispatchFiles[d.file])
      return { title: d.title, date: d.date, content }
  })

  console.log(mapData);
  return (
    <div className = "main-div">
      <BioParagraph bioHeader = "About" bioText = {bioContent}></BioParagraph>
      <MapPanel title="Projects Map" mapData = {mapData}></MapPanel>
      <Dispatches dispatches={dispatches}></Dispatches>
    </div>
  )
}

export default App
