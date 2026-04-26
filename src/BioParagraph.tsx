
import ReactMarkdown from 'react-markdown'

type BioParagraphParameters = {
    bioHeader: string,
    bioText: string,
}



function BioParagraph({bioHeader, bioText}:BioParagraphParameters){

    return(
        <div className = "bio-paragraph">
            <h2>{bioHeader}</h2>
            <ReactMarkdown>{bioText}</ReactMarkdown>
        </div>
    )

}


export default BioParagraph