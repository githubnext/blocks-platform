import { useView, Compiler, Editor, Error } from 'react-view';
import { ViewerProps } from '.';
import Annotation from 'react-image-annotation'
import {
  PointSelector,
  RectangleSelector,
  OvalSelector
} from 'react-image-annotation/lib/selectors'
import { useEffect, useState } from 'react';
import { octokit } from 'hooks';
import { useRouter } from 'next/router';


export default function AnnotateReactViewer({ contents, meta }: ViewerProps) {
  const { name, owner, repo, path } = meta

  const { annotations } = useRouter().query;
  const defaultAnnotations = annotations ? JSON.parse(decodeURIComponent(annotations as string)) : [];

  const componentName = name.split("/").pop().split(".")[0]

  const onSubmit = async ({ annotations, title, description }) => {
    const url = `https://composable-github.vercel.app?owner=${owner}&repo=${repo}&path=${path}&viewerOverride=annotate-react&annotations=${encodeURIComponent(JSON.stringify(annotations))}`
    const body = `${description}

[${url}](Annotated component)`
    console.log(url)

    const issue = await octokit.rest.issues.create({
      owner,
      repo,
      title,
      body
    });

    const issueUrl = issue.data.html_url
    if (issueUrl) window.open(issueUrl, "_blank")
  }

  const wrappedContents = `
() => {
  ${contents
      .replaceAll("export ", "")
      .replaceAll("import ", "// import ")
      .replaceAll("default ", "// default ")
    }

  return (
    <${componentName}>
      Text
    </${componentName}>
  )
}`

  const params = useView({
    initialCode: wrappedContents,
    scope: {},
    onUpdate: console.log,
  });

  return (
    <div className="relative">
      <Annotator defaultAnnotations={defaultAnnotations} onSubmit={onSubmit}>
        <Compiler {...params.compilerProps} />
      </Annotator>
      <Editor {...params.editorProps} language="jsx" />
      <Error {...params.errorProps} />
    </div>
  );
}

const annotationTypes = [{
  id: RectangleSelector.TYPE,
  name: "Rectangle",
}, {
  id: PointSelector.TYPE,
  name: "Point",
}, {
  id: OvalSelector.TYPE,
  name: "Oval",
}]

const Annotator = ({ defaultAnnotations, onSubmit, children }) => {
  const [annotation, setAnnotation] = useState({})
  const [annotationType, setAnnotationType] = useState(annotationTypes[0].id)
  const [annotations, setAnnotations] = useState(defaultAnnotations || [])
  const [issueTitle, setIssueTitle] = useState("")
  const [issueDescription, setIssueDescription] = useState("")
  const [hasEdited, setHasEdited] = useState(false)

  const onAddAnnotation = (annotation) => {
    const { geometry, data } = annotation
    setAnnotation({})
    const newAnnotations = [...annotations, {
      geometry,
      data: {
        ...data,
        id: Math.random()
      }
    }]
    setAnnotations(newAnnotations)
    setHasEdited(true)
  }

  return (
    <div className="flex py-6">

      <div className="flex-1 p-6 pt-0 z-10">
        <div className="flex items-center pb-1">
          <div className="mr-6 py-2 text-xs uppercase tracking-widest">
            Annotation type:
          </div>

          {annotationTypes.map(({ id, name }) => (
            <button
              key={id}
              className={`text-gray-800 text-xs uppercase tracking-widest py-2 px-5 rounded-full ${annotationType === id ? "bg-indigo-500 text-white" : "hover:bg-indigo-100"
                }`}
              onClick={() => {
                setAnnotationType(id)
              }}>
              {name}
            </button>
          ))}
        </div>
        <div className="">
          <Annotation
            annotations={annotations}
            type={annotationType}
            value={annotation}
            onChange={setAnnotation}
            onSubmit={onAddAnnotation}
          >{children}</Annotation>
        </div>
      </div>
      <div className="flex-1 p-6 self-stretch max-h-[40em] max-w-[35em]">
        {!!annotations.length && hasEdited && (
          <form className="flex flex-col h-full space-y-2" onSubmit={(e) => {
            e.preventDefault()
            onSubmit({
              annotations, title: issueTitle, description: issueDescription
            })
          }}>
            <div className="text-lg font-bold">Create a new GitHub Issue</div>
            <input className="bg-white border border-gray-300 focus:outline-none focus:border-indigo-500 py-2 px-4 block w-full appearance-none leading-normal" type="text" placeholder="Title" value={issueTitle} onChange={(e) => {
              setIssueTitle(e.target.value)
            }} />
            <textarea className="bg-white border border-gray-300 flex-1 focus:outline-none focus:border-indigo-500 py-2 px-4 block w-full appearance-none leading-normal resize-none"
              placeholder="Description"
              value={issueDescription}
              onChange={(e) => {
                setIssueDescription(e.target.value)
              }}
            />
            <button className={`bg-indigo-500 hover:bg-indigo-700 focus:bg-indigo-700 text-white py-3 px-4 rounded-full transition ${issueTitle.length > 0 && issueDescription.length > 0 ? "opacity-100" : "opacity-50"
              }`} type="submit">
              Create issue
            </button>

          </form>
        )}
      </div>
    </div>
  )
}