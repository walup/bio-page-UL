
import ReactMarkdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'

type BioParagraphParameters = {
    bioHeader: string,
    bioText: string,
}



function BioParagraph({bioHeader, bioText}:BioParagraphParameters){

    return(
        <div className = "bio-paragraph">
            <h2>{bioHeader}</h2>
            <ReactMarkdown remarkPlugins={[remarkBreaks]}>{bioText}</ReactMarkdown>
        </div>
    )

}


export default BioParagraph